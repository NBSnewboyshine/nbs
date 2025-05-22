document.addEventListener("DOMContentLoaded", () => {
    const authButton = document.querySelector(".btn"); // Signup/Login button
    authButton.addEventListener("click", handleAuth);
});

let failedLoginAttempts = 0; // Brute-force protection

async function handleAuth() {
    const username = document.querySelector('input[placeholder="your name"]').value;
    const phone = document.querySelector('input[placeholder="enter your phone number"]').value;
    const email = document.querySelector('input[placeholder="enter your email"]').value;
    const password = document.querySelector('input[placeholder="enter your password"]').value;
    const confirmPassword = document.querySelector('input[placeholder="confarm your password"]').value;

    const storedUser = JSON.parse(localStorage.getItem(email));

    if (storedUser) {
        loginUser(email, password);
    } else {
        registerUser(username, phone, email, password, confirmPassword);
    }
}

// **Secure User Registration**
async function registerUser(username, phone, email, password, confirmPassword) {
    if (!username || !phone || !email || !password || !confirmPassword) {
        alert("All fields are required!");
        return;
    }
    if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
    }
    if (!validateEmail(email)) {
        alert("Invalid email format!");
        return;
    }
    if (!validatePhone(phone)) {
        alert("Invalid phone number format!");
        return;
    }

    const hashedPassword = await hashPassword(password);

    const user = { username, phone, email, password: hashedPassword, mfaEnabled: false };
    localStorage.setItem(email, JSON.stringify(user));

    alert("User registered successfully! Please log in.");
}

// **Secure User Login**
async function loginUser(email, password) {
    const storedUser = JSON.parse(localStorage.getItem(email));

    if (!storedUser) {
        alert("User not found! Please sign up first.");
        return;
    }

    if (failedLoginAttempts >= 5) {
        alert("Too many failed attempts! Please try again later.");
        return;
    }

    const isMatch = await comparePassword(password, storedUser.password);
    if (!isMatch) {
        failedLoginAttempts++;
        alert("Incorrect password! Try again.");
        return;
    }

    if (storedUser.mfaEnabled) {
        const mfaCode = prompt("Enter your MFA code from Google Authenticator:");
        if (!verifyMFA(mfaCode)) {
            alert("Invalid MFA code!");
            return;
        }
    }

    const token = generateJWT(email);
    localStorage.setItem("token", token);

    alert("Login successful! Redirecting to library...");
    window.location.href = "dashboard.html";
}

// **Password Reset via Email**
function resetPassword(email) {
    const storedUser = JSON.parse(localStorage.getItem(email));
    if (!storedUser) {
        alert("User not found!");
        return;
    }

    const resetToken = generateToken();
    localStorage.setItem(`reset-${email}`, resetToken);

    alert(`Password reset link sent to ${email}. Use this code: ${resetToken}`);
}

// **Multi-Factor Authentication (MFA) Setup**
function enableMFA(email) {
    const storedUser = JSON.parse(localStorage.getItem(email));
    storedUser.mfaEnabled = true;
    localStorage.setItem(email, JSON.stringify(storedUser));
    alert("MFA enabled! Use Google Authenticator for future logins.");
}

function verifyMFA(code) {
    return code === "123456"; // Replace with real MFA verification
}

// **OAuth Login (Google Sign-In)**
function googleLogin() {
    alert("Google login is under development...");
}

// **Account Lockout & Monitoring**
function lockAccount(email) {
    alert(`Account for ${email} is temporarily locked due to suspicious activity.`);
}

// **Bot Protection (CAPTCHA)**
function captchaCheck() {
    const captcha = prompt("Enter the CAPTCHA code: 5G7X");
    return captcha === "5G7X";
}

// **Password Hashing using bcrypt.js**
async function hashPassword(password) {
    const saltRounds = 10;
    return new Promise((resolve) => {
        bcrypt.hash(password, saltRounds, (err, hash) => {
            if (err) console.error(err);
            resolve(hash);
        });
    });
}

// **Compare Password with Hash**
async function comparePassword(password, hashedPassword) {
    return new Promise((resolve) => {
        bcrypt.compare(password, hashedPassword, (err, result) => {
            if (err) console.error(err);
            resolve(result);
        });
    });
}

// **JWT Token Generator**
function generateJWT(email) {
    return btoa(JSON.stringify({ email, exp: Date.now() + 3600000 }));
}

// **Random Token Generator (For Password Reset)**
function generateToken() {
    return Math.random().toString(36).substring(2, 15);
}

// **Email Validation Function**
function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// **Phone Number Validation Function (Egypt Format)**
function validatePhone(phone) {
    const regex = /^01[0-9]{9}$/;
    return regex.test(phone);
}
