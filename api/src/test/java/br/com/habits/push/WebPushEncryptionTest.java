package br.com.habits.push;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.Signature;
import java.security.interfaces.ECPrivateKey;
import java.security.interfaces.ECPublicKey;
import java.time.Instant;
import java.util.Arrays;

import javax.crypto.Cipher;
import javax.crypto.KeyAgreement;
import javax.crypto.Mac;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.junit.jupiter.api.Test;

/** Criptografia do Web Push (RFC 8291) e assinatura VAPID (RFC 8292), spec 011 plan P2. */
class WebPushEncryptionTest {

    // Vetor de teste do apêndice A da RFC 8291
    private static final String PLAINTEXT = "When I grow up, I want to be a watermelon";
    private static final String AS_PRIVATE = "yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw";
    private static final String AS_PUBLIC =
        "BP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8";
    private static final String UA_PRIVATE = "q1dXpw3UpT5VOmu_cf_v6ih07Aems3njxI-JWgLcM94";
    private static final String UA_PUBLIC =
        "BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4";
    private static final String SALT = "DGv6ra1nlYgDCS1FRnbzlw";
    private static final String AUTH_SECRET = "BTBZMqHH6r4Tts7J_aSIgg";
    private static final String EXPECTED = "DGv6ra1nlYgDCS1FRnbzlwAAEABBBP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A_yl95bQpu6cVPTpK4Mqgkf1CXztLVBSt2Ks3oZwbuwXPXLWyouBWLVWGNWQexSgSxsj_Qulcy4a-fN";

    private static final byte[] PLAIN = PLAINTEXT.getBytes(StandardCharsets.UTF_8);

    @Test
    void cifraIgualAoVetorDaRfc8291() throws Exception {
        KeyPair server = new KeyPair(EcKeys.publicKey(Base64Url.decode(AS_PUBLIC)),
            EcKeys.privateKey(Base64Url.decode(AS_PRIVATE)));

        byte[] body = WebPushEncryption.encrypt(PLAIN, Base64Url.decode(UA_PUBLIC), Base64Url.decode(AUTH_SECRET),
            server, Base64Url.decode(SALT));

        assertThat(Base64Url.encode(body)).isEqualTo(EXPECTED);
    }

    @Test
    void oAparelhoDecifraUmaMensagemComChavesAleatorias() throws Exception {
        byte[] body = WebPushEncryption.encrypt(PLAIN, Base64Url.decode(UA_PUBLIC), Base64Url.decode(AUTH_SECRET));

        assertThat(decryptAsUserAgent(body)).isEqualTo(PLAIN);
    }

    @Test
    void cabecalhoTemSaltTamanhoDeRegistroEChavePublicaDoServidor() throws Exception {
        byte[] body = WebPushEncryption.encrypt(PLAIN, Base64Url.decode(UA_PUBLIC), Base64Url.decode(AUTH_SECRET));

        ByteBuffer header = ByteBuffer.wrap(body);
        header.position(16);
        assertThat(header.getInt()).isEqualTo(4096);
        assertThat(header.get()).isEqualTo((byte) 65);
        assertThat(body[21]).isEqualTo((byte) 0x04);
        // conteúdo + delimitador + tag de 16 bytes do GCM
        assertThat(body.length).isEqualTo(86 + PLAIN.length + 1 + 16);
    }

    @Test
    void vapidAssinaJwtVerificavelComAChavePublica() throws Exception {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("EC");
        generator.initialize(EcKeys.P256);
        KeyPair pair = generator.generateKeyPair();
        String publicKey = Base64Url.encode(EcKeys.uncompressed((ECPublicKey) pair.getPublic()));
        String privateKey = Base64Url.encode(toUnsigned32(((ECPrivateKey) pair.getPrivate()).getS().toByteArray()));
        VapidKeys vapid = new VapidKeys(publicKey, privateKey, "mailto:teste@example.com");
        Instant now = Instant.parse("2026-11-18T12:00:00Z");

        String authorization = vapid.authorization("https://fcm.googleapis.com/fcm/send/abc123", now);

        assertThat(authorization).startsWith("vapid t=").endsWith(", k=" + publicKey);
        String token = authorization.substring("vapid t=".length(), authorization.indexOf(','));
        String[] parts = token.split("\\.");
        assertThat(parts).hasSize(3);
        Signature verifier = Signature.getInstance("SHA256withECDSAinP1363Format");
        verifier.initVerify(pair.getPublic());
        verifier.update((parts[0] + "." + parts[1]).getBytes(StandardCharsets.US_ASCII));
        assertThat(verifier.verify(Base64Url.decode(parts[2]))).isTrue();

        JsonNode claims = new ObjectMapper().readTree(Base64Url.decode(parts[1]));
        assertThat(claims.get("aud").asText()).isEqualTo("https://fcm.googleapis.com");
        assertThat(claims.get("sub").asText()).isEqualTo("mailto:teste@example.com");
        assertThat(claims.get("exp").asLong()).isEqualTo(now.getEpochSecond() + 12 * 3600);
    }

    @Test
    void semChavesFicaIndisponivel() {
        assertThat(new VapidKeys("", "", "").available()).isFalse();
    }

    private static byte[] toUnsigned32(byte[] raw) {
        byte[] out = new byte[32];
        int length = Math.min(raw.length, 32);
        System.arraycopy(raw, raw.length - length, out, 32 - length, length);
        return out;
    }

    /** O lado do aparelho (RFC 8291/8188), escrito à parte para conferir o envio. */
    private static byte[] decryptAsUserAgent(byte[] body) throws Exception {
        byte[] salt = Arrays.copyOfRange(body, 0, 16);
        int idLength = body[20] & 0xff;
        byte[] asPublic = Arrays.copyOfRange(body, 21, 21 + idLength);
        byte[] ciphertext = Arrays.copyOfRange(body, 21 + idLength, body.length);
        byte[] uaPublic = Base64Url.decode(UA_PUBLIC);

        KeyAgreement agreement = KeyAgreement.getInstance("ECDH");
        agreement.init(EcKeys.privateKey(Base64Url.decode(UA_PRIVATE)));
        agreement.doPhase(EcKeys.publicKey(asPublic), true);
        byte[] ecdh = agreement.generateSecret();

        byte[] prkKey = hmac(Base64Url.decode(AUTH_SECRET), ecdh);
        byte[] keyInfo = join("WebPush: info\0".getBytes(StandardCharsets.US_ASCII), uaPublic, asPublic, new byte[] {1});
        byte[] ikm = hmac(prkKey, keyInfo);
        byte[] prk = hmac(salt, ikm);
        byte[] cek = Arrays.copyOf(hmac(prk, join("Content-Encoding: aes128gcm\0".getBytes(StandardCharsets.US_ASCII), new byte[] {1})), 16);
        byte[] nonce = Arrays.copyOf(hmac(prk, join("Content-Encoding: nonce\0".getBytes(StandardCharsets.US_ASCII), new byte[] {1})), 12);

        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.DECRYPT_MODE, new SecretKeySpec(cek, "AES"), new GCMParameterSpec(128, nonce));
        byte[] padded = cipher.doFinal(ciphertext);
        assertThat(padded[padded.length - 1]).as("delimitador do último registro").isEqualTo((byte) 2);
        return Arrays.copyOf(padded, padded.length - 1);
    }

    private static byte[] hmac(byte[] key, byte[] data) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(key, "HmacSHA256"));
        return mac.doFinal(data);
    }

    private static byte[] join(byte[]... parts) {
        int length = Arrays.stream(parts).mapToInt(p -> p.length).sum();
        ByteBuffer out = ByteBuffer.allocate(length);
        for (byte[] part : parts) {
            out.put(part);
        }
        return out.array();
    }
}
