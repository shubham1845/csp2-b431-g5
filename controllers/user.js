const User = require("../models/User");
const bcrypt = require("bcrypt");
const auth = require("../auth");
const { errorHandler } = require("../auth");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
require("dotenv").config();

module.exports.registerUser = (req, res) => {
  let newUser = new User({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    mobileNo: req.body.mobileNo,
    password: bcrypt.hashSync(req.body.password, 10), // Encrypt password
  });

  return newUser
    .save()
    .then((result) => {
      // Send email confirmation
      sendConfirmationEmail(result);
      res.status(201).send({
        message: "User registered successfully. Please confirm your email.",
        user: result,
      });
    })
    .catch((error) => {
      res.status(500).send({ error: error.message });
    });
};

// Function to send the confirmation email
const sendConfirmationEmail = async (user) => {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const confirmationUrl = `http://localhost:3000/api/auth/confirm-email/${user.confirmationToken}`;
  console.log(confirmationUrl);
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: user.email,
    subject: "Email Confirmation",
    text: `<h2>Email Confirmation</h2>
           <p>Thank you for registering. Please confirm your email by clicking the link below:</p>
           <a href="${confirmationUrl}">Confirm Email</a>`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log("Error sending email:", error);
    } else {
      console.log("Email sent:", info.response);
    }
  });
};

module.exports.confirmEmail = (req, res) => {
  const { token } = req.params;

  User.findOne({ confirmationToken: token })
    .then((user) => {
      if (!user) {
        return res.status(400).send({ message: "Invalid or expired token." });
      }

      user.emailConfirmed = true;
      user.confirmationToken = ""; // Clear the token

      return user
        .save()
        .then(() =>
          res.status(200).send({ message: "Email confirmed successfully." })
        )
        .catch((error) => res.status(500).send({ error: error.message }));
    })
    .catch((error) => res.status(500).send({ error: error.message }));
};

// User authentiation
module.exports.loginUser = (req, res) => {
  // login validation
  if (req.body.email.includes("@")) {
    // The "findOne" method returns the first record in the collection that matches the search criteria
    // We use the "findOne" method instead of the "find" method which returns all records that match the search criteria
    return User.findOne({ email: req.body.email })
      .then((result) => {
        // User does not exist
        if (result == null) {
          return res.status(404).send(false);

          // User exists
        } else {
          // Creates the variable "isPasswordCorrect" to return the result of comparing the login form password and the database password
          // The "compareSync" method is used to compare a non encrypted password from the login form to the encrypted password retrieved from the database and returns "true" or "false" value depending on the result
          // Check if email is confirmed
          if (!result.emailConfirmed) {
            return res.status(403).send({
              message: "Please confirm your email before logging in",
            });
          }
          // Check if password is correct
          const isPasswordCorrect = bcrypt.compareSync(
            req.body.password,
            result.password
          );

          // If the passwords match/result of the above code is true
          if (isPasswordCorrect) {
            // Generate an access token
            // Uses the "createAccessToken" method defined in the "auth.js" file
            return res
              .status(200)
              .send({ access: auth.createAccessToken(result) });

            // Passwords do not match
          } else {
            return res.status(401).send({
              status: false,
              message: "Please confirm your email and password",
            });
          }
        }
      })
      .catch((error) => errorHandler(error, req, res));
  } else {
    return res.status(400).send(false);
  }
};

// Controller for request password change through mail/notification
module.exports.requestPasswordReset = async (req, res) => {
  const { email } = req.body;
  if (email) {
    const user = await User.findOne({ email: email });
    if (user) {
      const secret = user._id + process.env.JWT_SECRET_KEY;
      const token = jwt.sign({ userID: user._id }, secret, {
        expiresIn: "15m",
      });
      const resetUrl = `http://localhost:3000/api/user/reset/${user._id}/${token}`;
      console.log(resetUrl);
      const transporter = nodemailer.createTransport({
        service: "Gmail",
        secure: true,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: user.email,
        subject: "Password Reset Request",
        text: `You requested a password reset. Please click the following resetUrl to reset your password: ${resetUrl}`,
      };

      await transporter.sendMail(mailOptions);

      res
        .status(200)
        .json({ message: "Password reset resetUrl sent to email." });
    } else {
      res.send({ status: "failed", message: "Email doesn't exists" });
    }
  } else {
    res.send({ status: "failed", message: "Email Field is Required" });
  }
};

// controller for reset password
module.exports.resetPassword = async (req, res) => {
  const { password, password_confirmation } = req.body;
  const { id, token } = req.params;
  const user = await User.findById(id);
  const new_secret = user._id + process.env.JWT_SECRET_KEY;
  try {
    jwt.verify(token, new_secret);
    if (password && password_confirmation) {
      if (password !== password_confirmation) {
        res.send({
          status: "failed",
          message: "New Password and Confirm New Password doesn't match",
        });
      } else {
        const salt = await bcrypt.genSalt(10);
        const newHashPassword = await bcrypt.hash(password, salt);
        await User.findByIdAndUpdate(user._id, {
          $set: { password: newHashPassword },
        });
        res.send({ status: "success", message: "Password Reset Successfully" });
      }
    } else {
      res.send({ status: "failed", message: "All Fields are Required" });
    }
  } catch (error) {
    console.log(error);
    res.send({ status: "failed", message: "Invalid Token" });
  }
};

//Get users details
module.exports.getProfile = (req, res) => {
  return User.findById(req.user.id)
    .then((user) => {
      if (!user) {
        // if the user has invalid token, send a message 'invalid signature'.
        return res.status(404).send({ message: "invalid signature" });
      } else {
        // if the user is found, return the user.
        user.password = "";
        return res.status(200).send(user);
      }
    })
    .catch((error) => errorHandler(error, req, res));
};
