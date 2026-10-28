const formLogin = document.querySelector("#form-login");
const mensagem = document.querySelector("#mensagem");
formLogin.addEventListener("submit", async (event) => {
  event.preventDefault(); mensagem.hidden = true;
  const button = formLogin.querySelector("button[type=submit]"); button.disabled = true;
  try {
    const response = await fetch(`${window.API_URL.replace(/\/$/, "")}/Login`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: formLogin.username.value, password: formLogin.password.value }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message || "Não foi possível entrar.");
    localStorage.setItem("token", result.token); localStorage.setItem("username", result.username);
    window.location.assign("/pacientes");
  } catch (error) { mensagem.textContent = error.message; mensagem.hidden = false; }
  finally { button.disabled = false; }
});
