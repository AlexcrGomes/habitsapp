package br.com.habits.push;

import java.util.Base64;

/** base64url sem preenchimento, o formato das chaves do Web Push (RFC 8291/8292). */
public final class Base64Url {

    private Base64Url() {
    }

    public static String encode(byte[] bytes) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    /** Aceita com ou sem preenchimento; lança IllegalArgumentException se não for base64url. */
    public static byte[] decode(String text) {
        return Base64.getUrlDecoder().decode(text);
    }
}
