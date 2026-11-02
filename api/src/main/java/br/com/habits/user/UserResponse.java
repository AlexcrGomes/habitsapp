package br.com.habits.user;

public record UserResponse(Long id, String name, String email, String weekMode) {

    public static UserResponse of(User user) {
        return new UserResponse(user.getId(), user.getName(), user.getEmail(), user.getWeekMode());
    }
}
