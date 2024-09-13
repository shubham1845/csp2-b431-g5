const jwt = require("jsonwebtoken");

require("dotenv").config();

// [SECTION] JSON Web Tokens
/*
- JSON Web Token or JWT is a way of securely passing information from the server to the client or to other parts of a server
- Information is kept secure through the use of the secret code
- Only the system that knows the secret code that can decode the encrypted information
- Imagine JWT as a gift wrapping service that secures the gift with a lock
- Only the person who knows the secret code can open the lock
- And if the wrapper has been tampered with, JWT also recognizes this and disregards the gift
- This ensures that the data is secure from the sender to the receiver
*/

// [SECTION] Token Creation
/*
	Pack the gift and provide a lock with the secret code as the key
*/
module.exports.createAccessToken = (user) => {
  // The data will be received from the registration form
  // When the user logs in, a token will be create with user's information
  const data = {
    id: user._id,
    email: user.email,
    isAdmin: user.isAdmin,
  };

  // Generate a JSON web token using the jwt's sign method
  // Generates the token using the form data and the secret code with no additional options provided
  // SECRET_KEY is a User defined string data that will be used to create our JSON web tokens
  // Used in the algorithm for encrypting our data which makes it difficult to decode the information without the defined secret keyword
  //Since this is a critical data, we will use the .env to secure the secret key. "Keeping your secrets secret".
  return jwt.sign(data, process.env.JWT_SECRET_KEY, {});
};

// [SECTION] Token Verification
module.exports.verify = (req, res, next) => {
  console.log(req.headers.authorization);

  let token = req.headers.authorization;

  if (typeof token === "undefined") {
    return res.send({ auth: "Failed. No token." });
  } else {
    console.log(token);
    token = token.slice(7, token.length);
    console.log(token);

    // [SECTION] Token Decryption
    jwt.verify(token, process.env.JWT_SECRET_KEY, function (err, decodedToken) {
      if (err) {
        return res.status(403).send({
          auth: "Failed",
          message: err.message,
        });
      } else {
        console.log("result from verify method:");
        console.log(decodedToken);

        req.user = decodedToken;

        next();
      }
    });
  }
};

// [SECTION] Verify Admin
// The "verify" method should be used before "verifyAdmin" because it is used to check the validity of the jwt. Only when the token has been validated should we check if the user is an admin or not.
// The "verify" method is also the one responsible for updating the "req" object to include the "user" details/decoded token in the request body.
// Being an ExpressJS middleware, it should also be able to receive
module.exports.verifyAdmin = (req, res, next) => {
  // console.log("result from verifyAdmin method: ");
  // console.log(req.user);
  // next();

  // Check if the owner of the token is an admin
  if (req.user.isAdmin) {
    // if it is, move to the next middleware/controller using next()
    next();
  } else {
    // if not an admin, end the req-res cycle by sending appropriate response
    //and status code
    return res.status(403).send({
      auth: "Failed",
      message: "Action Forbidden",
    });
  }
};

// [SECTION] Error Handler
module.exports.errorHandler = (err, req, res, next) => {
  // Log the error
  console.log(err);

  const statusCode = err.status || 500;
  const errorMessage = err.message || "Internal Server Error";

  // Send a standardized response
  res.json({
    error: {
      message: errorMessage,
      errorCode: err.code || "SERVER_ERROR",
      details: err.details || null,
    },
  });
};
