document.addEventListener("DOMContentLoaded", async () => {

    const supabase = window.supabaseClient;

    if (!supabase) {
        alert("Supabase nÃ£o foi inicializado.");
        return;
    }

    const form = document.getElementById("loginForm");
    const email = document.getElementById("email");
    const password = document.getElementById("password");
    const button = document.getElementById("loginButton");
    const message = document.getElementById("loginMessage");
    const toggle = document.getElementById("togglePassword");

    const showMessage = (text, type = "error") => {
        message.textContent = text;
        message.className = `message show ${type}`;
    };

    toggle.addEventListener("click", () => {
        const visible = password.type === "text";
        password.type = visible ? "password" : "text";
        toggle.textContent = visible ? "ðŸ‘" : "ðŸ™ˆ";
    });

    const { data } = await supabase.auth.getSession();

    if (data.session) {
        window.location.href = "app.html";
        return;
    }

    form.addEventListener("submit", async event => {

        event.preventDefault();

        button.disabled = true;
        button.textContent = "Entrando...";
        message.className = "message";

        try {

            const { error } =
                await supabase.auth.signInWithPassword({
                    email: email.value.trim(),
                    password: password.value
                });

            if (error) {
                showMessage(
                    error.message.includes("Invalid login credentials")
                        ? "E-mail ou senha incorretos."
                        : error.message
                );
                return;
            }

            showMessage(
                "Login realizado. Aguarde...",
                "success"
            );

            setTimeout(() => {
                window.location.href = "app.html";
            }, 300);

        } catch (error) {

            console.error(error);

            showMessage(
                "NÃ£o foi possÃ­vel realizar o login."
            );

        } finally {

            button.disabled = false;
            button.textContent = "Entrar";

        }

    });

});
