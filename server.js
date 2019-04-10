require('dotenv').config({path: '.env'})

const express = require('express');
const paypal = require('paypal-rest-sdk');

const app = express();

paypal.configure({
  'mode': 'sandbox', //sandbox or live
  'client_id': process.env.CLIENTID_PP,
  'client_secret': process.env.SECRET_PP,
})

app.get('/', (req, res) => {
  return res.status(200).json({
    success: true
  })
})

app.get('/pay', (req, res) => {
  const create_payment_json = {
    "intent": "sale",
    "payer": {
        "payment_method": "paypal"
    },
    "redirect_urls": {
        "return_url": "http://localhost:3000/success",
        "cancel_url": "http://localhost:3000/cancel"
    },
    "transactions": [{
        "item_list": {
            "items": [{
                "name": "Tour Da Nang",
                "sku": "001",
                "price": "10.00",
                "currency": "USD",
                "quantity": 1
            }]
        },
        "amount": {
            "currency": "USD",
            "total": "10.00"
        },
        "description": "Tour di da nang 3N 2D"
    }]
  };

  paypal.payment.create(create_payment_json, function (error, payment) {
    if (error) {
        throw error;
    } else {
        console.log(payment)
        for(let i = 0; i < payment.links.length; i++) {
          if (payment.links[i].rel === 'approval_url') {
            res.redirect(payment.links[i].href)
          }
        }
    }
});

});

app.get('/success', (req, res) => {
  const execute_payment_json = {
    "payer_id": req.query.PayerID,
    "transactions": [{
        "amount": {
            "currency": "USD",
            "total": "10.00"
        }
    }]
  };

  const paymentId = req.query.paymentId;

  paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
      if (error) {
          console.log(error.response);
          throw error;
      } else {
          console.log("Get Payment Response");
          console.log(JSON.stringify(payment));
      }
  });

  return res.status(200).json({
    success: true
  })
});

app.get('/cancel', (req, res) => {
  return res.status(200).json({
    success: false
  })
});

app.get('/send', (req, res) => {
  const sender_batch_id = Math.random().toString(36).substring(9);

  const create_payout_json = {
      "sender_batch_header": {
          "sender_batch_id": sender_batch_id,
          "email_subject": "You have a payment"
      },
      "items": [
          {
              "recipient_type": "EMAIL",
              "amount": {
                  "value": 8,
                  "currency": "USD"
              },
              "receiver": "payment.parner@didauday.me",
              "note": "Thank you.",
              "sender_item_id": "item_3"
          }
      ]
  };

  const sync_mode = 'false';

  paypal.payout.create(create_payout_json, sync_mode, function (error, payout) {
      if (error) {
          console.log(error.response);
          throw error;
          return res.status(400).json({
            success: false
          })
      } else {
          console.log("Create Single Payout Response");
          console.log(payout);
          return res.status(200).json({
            success: true
          })
      }
  });
})

app.listen(3000, () => console.log('Server is running'));