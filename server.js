const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");

const app = express();
const PORT = 3009;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Configuración de Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "hachiyt001@gmail.com", // Correo del administrador
    pass: "pjzb gnwy ccxd pnmv", // Contraseña o contraseña de aplicación
  },
});

// Base de datos temporal para almacenar solicitudes pendientes
const solicitudes = {};

// 📩 Enviar correo al administrador con un botón de confirmación
app.post("/enviar-correo-admin", (req, res) => {
  const { nombreReceptor, correoElectronico } = req.body;

  // Guardamos la solicitud en la base de datos temporal
  solicitudes[correoElectronico] = { nombreReceptor, correoElectronico };

  // Construimos la URL correctamente
  const confirmUrl = `http://localhost:${PORT}/confirmar-registro?correo=${encodeURIComponent(correoElectronico)}`;

  const mailOptions = {
    from: "hachiyt001@gmail.com",
    to: "hachiyt001@gmail.com", // Administrador
    subject: "Nueva solicitud de registro",
    html: `
      <p>Nombre del receptor: <strong>${nombreReceptor}</strong></p>
      <p>Correo electrónico: <strong>${correoElectronico}</strong></p>
      <p>
        <a href="${confirmUrl}" 
           style="padding: 10px; background: green; color: white; text-decoration: none; border-radius: 5px;">
           Confirmar Registro
        </a>
      </p>
    `,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error enviando correo:", error);
      res.status(500).send("Error enviando correo");
    } else {
      console.log("Correo enviado al administrador:", info.response);
      res.status(200).send("Correo enviado al administrador");
    }
  });
});

// 🔐 Ruta para confirmar el registro y asignar un número de cuenta
app.get("/confirmar-registro", (req, res) => {
  const { correo } = req.query;

  if (!correo || !solicitudes[correo]) {
    return res.status(404).send("Solicitud no encontrada o ya procesada.");
  }

  // Formulario para ingresar el número de cuenta
  res.send(`
    <h2>Confirmar Registro</h2>
    <form action="/enviar-correo-usuario" method="POST">
      <input type="hidden" name="correoElectronico" value="${correo}">
      <label>Número de Cuenta:</label>
      <input type="text" name="numeroCuenta" required>
      <button type="submit">Confirmar</button>
    </form>
  `);
});

// 📩 Enviar correo al usuario con su número de cuenta
app.post("/enviar-correo-usuario", bodyParser.urlencoded({ extended: true }), (req, res) => {
  const { correoElectronico, numeroCuenta } = req.body;

  if (!solicitudes[correoElectronico]) {
    return res.status(404).send("Solicitud no encontrada o ya procesada.");
  }

  const mailOptions = {
    from: "hachiyt001@gmail.com",
    to: correoElectronico,
    subject: "Registro exitoso en Ocean and Wild Menu",
    text: `Tu número de cuenta para iniciar sesión es: ${numeroCuenta}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error enviando correo:", error);
      res.status(500).send("Error enviando correo");
    } else {
      console.log("Correo enviado al usuario:", info.response);

      // Eliminamos la solicitud ya procesada
      delete solicitudes[correoElectronico];

      res.send("Registro confirmado y correo enviado al usuario.");
    }
  });
});

// Ruta raíz para evitar "Cannot GET /"
app.get("/", (req, res) => {
    res.send("Servidor funcionando correctamente");
  });

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});
