require("dotenv").config();
const axios = require("axios");

exports.createTransaction = async (req, res) => {
   const { price, item_id } = req.body;

   try {
      const timestamp = Date.now();
      const order_id = `MentalQ-${timestamp}`;

      if (!price || !item_id) {
         return res.status(400).json({
            error: true,
            message: "price and item_id are required",
         });
      }

      const requestBody = {
         transaction_details: {
            order_id: order_id,
            gross_amount: price,
         },
         credit_card: {
            secure: true,
         },
         item_details: [
            {
               id: item_id,
               price: price,
               quantity: 1,
               name: "MentalQ - Psychologist Service",
            },
         ],
      };

      const response = await axios.post(
         "https://app.sandbox.midtrans.com/snap/v1/transactions",
         requestBody,
         {
            headers: {
               "Content-Type": "application/json",
               Authorization: `Basic ${Buffer.from(
                  process.env.MIDTRANS_SERVER_KEY
               ).toString("base64")}:`,
            },
         }
      );

      res.status(200).json({
         message: "Transaction created successfully",
         error: false,
         data: {
            item_id: item_id,
            order_id: order_id,
            token: response.data.token,
            redirect_url: response.data.redirect_url,
         },
      });
   } catch (e) {
      res.status(500).json({ error: error.message });
   }
};

exports.getStatusTransaction = async (req, res) => {
   const { id } = req.params;

   try {
      const response = await axios.get(
         `https://api.sandbox.midtrans.com/v2/${id}/status`,
         {
            headers: {
               Authorization: `Basic ${Buffer.from(
                  process.env.MIDTRANS_SERVER_KEY
               ).toString("base64")}:`,
            },
         }
      );

      res.status(200).json({
         message: "Transaction status retrieved successfully",
         error: false,
         data: {
            transaction_status: response.data.transaction_status,
            status_message: response.data.status_message,
         },
      });
   } catch (error) {
      res.status(500).json({ error: error.message });
   }
};

exports.cancelTransaction = async (req, res) => {
   const { id } = req.params;

   try {
      const response = await axios.post(
         `https://api.sandbox.midtrans.com/v2/${id}/cancel`,
         {
            headers: {
               Authorization: `Basic ${Buffer.from(
                  process.env.MIDTRANS_SERVER_KEY
               ).toString("base64")}:`,
            },
         }
      );

      if (response.data.status_code !== "200") {
         return res.status(400).json({
            error: true,
            message: "Failed to cancel transaction",
         });
      }

      res.status(200).json({
         message: "Transaction canceled successfully",
         error: false,
         data: {
            transaction_status: response.data.transaction_status,
            status_message: response.data.status_message,
         },
      });
   } catch (error) {
      res.status(500).json({ error: error.message });
   }
};
