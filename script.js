document.getElementById("registerForm").addEventListener("submit", function(event) {
    event.preventDefault();
    let password = document.getElementById("password").value;
    let confirmPassword = document.getElementById("confirmPassword").value;

    if (password !== confirmPassword) {
        alert("كلمات المرور غير متطابقة");
    } else {
        alert("تم التسجيل بنجاح!");
    }
});

document.getElementById("loginForm").addEventListener("submit", function(event) {
    event.preventDefault();
    let email = document.getElementById("email").value;
    let password = document.getElementById("password").value;

    if (email && password) {
        alert("تم تسجيل الدخول!");
    } else {
        alert("يرجى ملء جميع الحقول");
    }
});
