const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const sql = require('mssql');
const path = require('path');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


const config = {
  user: 'satest',
  password: 'TslTsl1',
  server: 'DESKTOP-7R54CV9',
  database: 'formdata',
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

sql.connect(config).then(() => {
  console.log('Connected to the database.');
}).catch(err => {
  console.error('Database connection failed:', err);
});

app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const pool = await sql.connect(config);

    const existingUser = await pool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT * FROM Users WHERE email = @email');

    if (existingUser.recordset.length > 0) {
      return res.send('registration-error: User already exists.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.request()
      .input('username', sql.NVarChar, username)
      .input('email', sql.NVarChar, email)
      .input('password', sql.NVarChar, hashedPassword)
      .query('INSERT INTO Users (username, email, password) VALUES (@username, @email, @password)');

    res.send('registration-success');
  } catch (error) {
    console.error('Error during registration:', error);
    res.send('registration-error');
  }
});


app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const pool = await sql.connect(config);
    const result = await pool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT * FROM Users WHERE email = @email');

    if (result.recordset.length > 0) {
      const user = result.recordset[0];
      console.log('Retrieved user from database:', { id: user.id, email: user.email });

      const match = await bcrypt.compare(password, user.password);
      console.log('Password match:', match); 

      if (match) {
        res.send('login-success');
      } else {
        res.send('login-error: Invalid email or password.');
      }
    } else {
      res.send('login-error: User not found.');
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.send('login-error: Login failed!');
  }
});

app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Register/Login</title>
    <style>
      body {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        background-color: #f0f0f0;
        margin: 0;
        font-family: Arial, sans-serif;
      }

      .auth-box {
        width: 400px;
        padding: 40px;
        background: white;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        border-radius: 10px;
        transition: all 0.3s ease;
      }

      h2 {
        text-align: center;
        margin-bottom: 20px;
        font-size: 2em;
        color: #4caf50;
      }

      .input-box {
        position: relative;
        margin-bottom: 30px;
      }

      .input-box input {
        width: 100%;
        padding: 10px;
        background: none;
        border: none;
        border-bottom: 2px solid #ccc;
        outline: none;
        color: #333;
        font-size: 16px;
      }

      .input-box label {
        position: absolute;
        top: 0;
        left: 0;
        color: #999;
        pointer-events: none;
        transition: 0.5s;
      }

      .input-box input:focus ~ label,
      .input-box input:valid ~ label {
        top: -20px;
        left: 0;
        color: #4caf50;
        font-size: 12px;
      }

      .input-box .icon {
        position: absolute;
        top: 10px;
        left: 10px;
        color: #4caf50;
      }

      button {
        width: 100%;
        padding: 10px;
        background-color: #4caf50;
        border: none;
        color: white;
        font-size: 18px;
        border-radius: 5px;
        cursor: pointer;
        margin-bottom: 20px;
      }

      button:hover {
        background-color: #45a049;
      }

      .popup {
        display: none;
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 300px;
        padding: 20px;
        background-color: white;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        text-align: center;
        border-radius: 10px;
        transition: opacity 0.3s ease;
      }

      .popup h2 {
        margin: 0;
        font-size: 20px;
        color: #4caf50;
      }

      .popup button {
        margin-top: 20px;
        padding: 10px 20px;
        background-color: #4caf50;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
      }

      .popup button:hover {
        background-color: #45a049;
      }

      
      .overlay {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 500;
        transition: opacity 0.3s ease;
      }
      
      .auth-link {
        text-align: center;
      }

      .auth-link a {
        color: #4caf50;
        text-decoration: none;
        font-size: 16px;
        cursor: pointer;
      }

      .auth-link a:hover {
        text-decoration: underline;
      }
    </style>
  </head>
  <body>
    <section>
      <div class="auth-box">
        
        <form id="registerForm" method="POST" action="/register">
          <h2>Register</h2>
          <div class="input-box">
            <span class="icon"><ion-icon name="person"></ion-icon></span>
            <input type="text" name="username" required />
            <label>Username</label>
          </div>
          <div class="input-box">
            <span class="icon"><ion-icon name="mail"></ion-icon></span>
            <input type="email" name="email" required />
            <label>Email</label>
          </div>
          <div class="input-box">
            <span class="icon"><ion-icon name="lock-closed"></ion-icon></span>
            <input type="password" name="password" required />
            <label>Password</label>
          </div>
          <button type="submit">Register</button>
          <div class="auth-link">
            <p>Already have an account?</p>
            <a href="#">Login</a>
          </div>
        </form>

        
        <form id="loginForm" method="POST" action="/login" style="display: none;">
          <h2>Login</h2>
          <div class="input-box">
            <span class="icon"><ion-icon name="mail"></ion-icon></span>
            <input type="email" name="email" required />
            <label>Email</label>
          </div>
          <div class="input-box">
            <span class="icon"><ion-icon name="lock-closed"></ion-icon></span>
            <input type="password" name="password" required />
            <label>Password</label>
          </div>
          <button type="submit">Login</button>
          <div class="auth-link">
            <p>Don't have an account?</p>
            <a href="#">Register</a>
          </div>
        </form>
      </div>
    </section>

    
    <div class="overlay" id="overlay"></div>
    <div class="popup" id="popup">
      <h2 id="popupMessage">Operation Successful!</h2>
      <button id="closePopup">OK</button>
    </div>

    <script type="module" src="https://unpkg.com/ionicons@5.5.2/dist/ionicons/ionicons.esm.js"></script>
    <script nomodule src="https://unpkg.com/ionicons@5.5.2/dist/ionicons/ionicons.js"></script>
    <script>
     
      document.querySelectorAll('.auth-link a').forEach(link => {
        link.addEventListener('click', function(e) {
          e.preventDefault();
          const isLogin = this.textContent.includes('Login');
          document.getElementById('registerForm').style.display = isLogin ? 'none' : 'block';
          document.getElementById('loginForm').style.display = isLogin ? 'block' : 'none';
          document.querySelector('.auth-box').style.transform = isLogin ? 'translateY(-100px)' : 'translateY(0)';
        });
      });

      
      document.getElementById('registerForm').addEventListener('submit', handleFormSubmit);
      document.getElementById('loginForm').addEventListener('submit', handleFormSubmit);

      function handleFormSubmit(event) {
        event.preventDefault(); 
        const formData = new FormData(this);
        const action = this.getAttribute('action');

        fetch(action, {
          method: 'POST',
          body: new URLSearchParams(formData),
        })
        .then(response => response.text())
        .then(result => {
          if (result.startsWith('registration-success') || result.startsWith('login-success')) {
            showPopup(result);
          } else {
            showPopup(result, 'error'); 
          }
        })
        .catch(error => {
          console.error('Error:', error);
          showPopup('An unexpected error occurred. Please try again.', 'error');
        });
      }

     
      function showPopup(message, type = 'success') {
        const popup = document.getElementById('popup');
        const popupMessage = document.getElementById('popupMessage');
        popupMessage.textContent = message;
        popup.style.backgroundColor = type === 'success' ? '#dff0d8' : '#f2dede'; 
        popup.style.color = type === 'success' ? '#3c763d' : '#a94442';
        document.getElementById('overlay').style.display = 'block';
        popup.style.display = 'block';
      }

     
      document.getElementById('closePopup').addEventListener('click', function() {
        document.getElementById('popup').style.display = 'none';
        document.getElementById('overlay').style.display = 'none';
      });
    </script>
  </body>
  </html>`);
});

app.listen(3000, () => {
  console.log('Server is running on port 3000.');
});
