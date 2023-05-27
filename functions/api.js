const express = require("express");
const cors = require("cors");
const stripe = require("stripe")(
  "sk_test_51N6SokEyrZyjTHe0p6XLtVz9PsbTuhtvaxAf4TNaUGdOUS69nxVgjuwvRljbzzJVBnxGPZgiZ7OronMgVBiTvfcf00Ag1ytyht"
);
const serverless = require("serverless-http");

const app = express();
app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 3001;

app.get("/", (req, res) => res.status(200).json({ msg: "hi" }));

app.post("/test", (req, res) => res.status(200).json({ msg: "hi" }));

//create payement intent
app.post("/create-payment-intent", async (req, res) => {
  const { amount } = req.body;
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
    });
    console.log(paymentIntent);
    res.status(200).json(paymentIntent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


//customer save
app.post("/save", async (req, res) => {
  const { email, name } = req.body;

  if (email == null || name == null) {
    res.status(422).json({
      status: 422,
      message: "Unprocessable Content",
    });

    return;
  }

  stripe.customers.create(
    {
      email: email,
      name: name,
      description: "New customer",
    },
    function (err, customer) {
      if (err) {
        res.status(500).json({
          status: 500,
          message: "internal server error occured",
          error: err,
        });
      } else {
        res.status(200).json({
          status: 200,
          message: "customer saved successfully",
          data: customer,
        });
      }
    }
  );
});

//subscribe to recurring payment
app.post('/subscribe',async (req, res) => {
  const { customerId, priceId , paymentMethod } = req.body;

  if (customerId == null) {
    res.status(422).json({
      status: 422,
      message: "Unprocessable Content",
    });

    return;
  }

  stripe.subscriptions.create(
    {
      customer: customerId,
      items: [
        {
          price: priceId,
        },
      ],
      trial_period_days: 0,
      metadata: {
        order_id: "12345",
      },
      default_payment_method: paymentMethod,
    },

    function (err, subscription) {
      if (err) {
        
        res.status(500).json({
          status: 500,
          message: "internal server error occured",
          data: err,
        });
      } else {
        
        res.status(200).json({
          status: 200,
          message: "subscription created successfully",
          data: subscription,
        });
      }
    }
  );
} )


app.post('/payment', async (req, res) => {
  const { cardNo, expMonth, expYear, cvc } = req.body;
 
  if (cardNo == null || expMonth == null || expYear == null || cvc == null ) {
    res.status(422).json({
      status: 422,
      message: "Unprocessable Content",
    });

    return;
  }

  try {
    // Create a payment method
    stripe.paymentMethods.create(
      {
        type: "card",
        card: {
          number: cardNo, // Replace with a valid card number
          exp_month: expMonth, // Replace with the expiration month
          exp_year: expYear, // Replace with the expiration year
          cvc: cvc, // Replace with the CVC code
        },
      },
      function (err, paymentMethod) {
        if (err) {
          res.status(500).json({
            status: 500,
            message: "internal server error occured",
            error: err,
          });
        } else {
          
          res.status(200).json({
            status: 200,
            message: "payment method created successfully",
            data: paymentMethod,
          });
        }
      }
    );
  } catch (error) {
    console.log(error)
  }

  //res.send("Hello, World!");
} )


app.post('/attach', async (req, res) => {
 
  const {customerId , paymentMethod} = req.body

  if (customerId == null) {
    res.status(422).json({
      status: 422,
      message: "Unprocessable Content",
    });

    return;
  }


  
    // Attach a payment method to a customer
    stripe.paymentMethods.attach(
      paymentMethod, // Replace with the payment method ID
      {
        customer: customerId, // Replace with the customer ID
      },
      function (err, paymentMethod) {
        if (err) {
          
          res.status(500).json({
            status: 500,
            message: "internal server error occured",
            error: err,
          });
        } else {
          
          res.status(200).json({
            status: 200,
            message: "payment method attached successfully",
            data: paymentMethod,
          });
        }
      }
    );
  

  //res.send("Hello, World!");
} )

// app.listen(PORT, () => console.log("Server running on port 5000"));
module.exports.handler = serverless(app);
