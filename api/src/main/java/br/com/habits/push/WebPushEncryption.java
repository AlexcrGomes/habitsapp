package br.com.habits.push;

import java.io.ByteArrayOutputStream;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.SecureRandom;
import java.security.interfaces.ECPublicKey;
import java.util.Arrays;

import javax.crypto.Cipher;
import javax.crypto.KeyAgreement;
import javax.crypto.Mac;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

/**
 * Cifra a mensagem para o aparelho no formato "aes128gcm" do Web Push (RFC 8291 + RFC 8188),
 * só com a biblioteca padrão do Java (spec 011, plan P2). Um único registro: as mensagens do
 * Habits têm poucas centenas de bytes.
 */
public final class WebPushEncryption {

    /** Tamanho de registro anunciado no cabeçalho (RFC 8188). */
    static final int RECORD_SIZE = 4096;

    private static final SecureRandom RANDOM = new SecureRandom();

    private WebPushEncryption() {
    }

    /**
     * @param uaPublic   chave pública do aparelho ({@code p256dh}), 65 bytes
     * @param authSecret segredo de autenticação do aparelho ({@code auth}), 16 bytes
     */
    public static byte[] encrypt(byte[] plaintext, byte[] uaPublic, byte[] authSecret) throws GeneralSecurityException {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("EC");
        generator.initialize(EcKeys.P256);
        byte[] salt = new byte[16];
        RANDOM.nextBytes(salt);
        return encrypt(plaintext, uaPublic, authSecret, generator.generateKeyPair(), salt);
    }

    /** Versão determinística, usada pelo teste com o vetor do apêndice A da RFC 8291. */
    static byte[] encrypt(byte[] plaintext, byte[] uaPublic, byte[] authSecret, KeyPair serverKeys, byte[] salt)
            throws GeneralSecurityException {
        if (authSecret.length != 16 || salt.length != 16) {
            throw new GeneralSecurityException("segredo ou salt com tamanho inválido");
        }
        byte[] asPublic = EcKeys.uncompressed((ECPublicKey) serverKeys.getPublic());

        KeyAgreement agreement = KeyAgreement.getInstance("ECDH");
        agreement.init(serverKeys.getPrivate());
        agreement.doPhase(EcKeys.publicKey(uaPublic), true);
        byte[] ecdhSecret = agreement.generateSecret();

        // RFC 8291, seção 3.4
        byte[] prkKey = hmac(authSecret, ecdhSecret);
        byte[] keyInfo = concat("WebPush: info\0".getBytes(StandardCharsets.US_ASCII), uaPublic, asPublic);
        byte[] ikm = expand(prkKey, keyInfo, 32);

        // RFC 8188, seção 2.2 e 2.3
        byte[] prk = hmac(salt, ikm);
        byte[] cek = expand(prk, "Content-Encoding: aes128gcm\0".getBytes(StandardCharsets.US_ASCII), 16);
        byte[] nonce = expand(prk, "Content-Encoding: nonce\0".getBytes(StandardCharsets.US_ASCII), 12);

        // Último (e único) registro: conteúdo seguido do delimitador 0x02, sem preenchimento extra
        byte[] padded = Arrays.copyOf(plaintext, plaintext.length + 1);
        padded[plaintext.length] = 0x02;
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(cek, "AES"), new GCMParameterSpec(128, nonce));
        byte[] ciphertext = cipher.doFinal(padded);

        ByteBuffer header = ByteBuffer.allocate(16 + 4 + 1 + asPublic.length);
        header.put(salt).putInt(RECORD_SIZE).put((byte) asPublic.length).put(asPublic);
        return concat(header.array(), ciphertext);
    }

    private static byte[] hmac(byte[] key, byte[] data) throws GeneralSecurityException {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(key, "HmacSHA256"));
        return mac.doFinal(data);
    }

    /** HKDF-Expand com uma única rodada (saída de até 32 bytes). */
    private static byte[] expand(byte[] prk, byte[] info, int length) throws GeneralSecurityException {
        return Arrays.copyOf(hmac(prk, concat(info, new byte[] {1})), length);
    }

    private static byte[] concat(byte[]... parts) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        for (byte[] part : parts) {
            out.writeBytes(part);
        }
        return out.toByteArray();
    }
}
