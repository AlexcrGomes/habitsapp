package br.com.habits.push;

import java.math.BigInteger;
import java.security.AlgorithmParameters;
import java.security.GeneralSecurityException;
import java.security.KeyFactory;
import java.security.interfaces.ECPrivateKey;
import java.security.interfaces.ECPublicKey;
import java.security.spec.ECGenParameterSpec;
import java.security.spec.ECParameterSpec;
import java.security.spec.ECPoint;
import java.security.spec.ECPrivateKeySpec;
import java.security.spec.ECPublicKeySpec;
import java.util.Arrays;

/** Conversões entre chaves P-256 do JDK e os bytes crus usados pelo Web Push. */
final class EcKeys {

    static final ECParameterSpec P256 = p256();

    private EcKeys() {
    }

    private static ECParameterSpec p256() {
        try {
            AlgorithmParameters parameters = AlgorithmParameters.getInstance("EC");
            parameters.init(new ECGenParameterSpec("secp256r1"));
            return parameters.getParameterSpec(ECParameterSpec.class);
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("P-256 indisponível no JDK", e);
        }
    }

    /** Ponto não comprimido: 0x04 || X (32 bytes) || Y (32 bytes). */
    static ECPublicKey publicKey(byte[] uncompressed) throws GeneralSecurityException {
        if (uncompressed.length != 65 || uncompressed[0] != 0x04) {
            throw new GeneralSecurityException("chave pública P-256 inválida");
        }
        BigInteger x = new BigInteger(1, Arrays.copyOfRange(uncompressed, 1, 33));
        BigInteger y = new BigInteger(1, Arrays.copyOfRange(uncompressed, 33, 65));
        return (ECPublicKey) KeyFactory.getInstance("EC").generatePublic(new ECPublicKeySpec(new ECPoint(x, y), P256));
    }

    /** Escalar privado d em 32 bytes. */
    static ECPrivateKey privateKey(byte[] d) throws GeneralSecurityException {
        if (d.length != 32) {
            throw new GeneralSecurityException("chave privada P-256 inválida");
        }
        return (ECPrivateKey) KeyFactory.getInstance("EC").generatePrivate(new ECPrivateKeySpec(new BigInteger(1, d), P256));
    }

    static byte[] uncompressed(ECPublicKey key) {
        byte[] out = new byte[65];
        out[0] = 0x04;
        copyUnsigned(key.getW().getAffineX(), out, 1);
        copyUnsigned(key.getW().getAffineY(), out, 33);
        return out;
    }

    /** Escreve o inteiro em 32 bytes big-endian (sem o byte de sinal, com zeros à esquerda). */
    private static void copyUnsigned(BigInteger value, byte[] out, int offset) {
        byte[] raw = value.toByteArray();
        int length = Math.min(raw.length, 32);
        System.arraycopy(raw, raw.length - length, out, offset + 32 - length, length);
    }
}
