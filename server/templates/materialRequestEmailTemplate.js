module.exports = function materialRequestEmailTemplate(data) {
  const {
    user,
    date,
    customerName,
    requestType,
    deliveryOrPickupDate,
    deliveryAddressStreet,
    deliveryAddressCity,
    deliveryAddressProvince,
    deliveryAddressPostalCode,
    deliveryInstruction,
    material
  } = data;

  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Material Request</title>
    <style>
      body {
        font-family: Arial, Helvetica, sans-serif;
        background: #f5f6fa;
        padding: 20px;
      }
      .container {
        background: #ffffff;
        border-radius: 8px;
        max-width: 700px;
        margin: auto;
        padding: 25px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
      .title {
        font-size: 22px;
        font-weight: bold;
        margin-bottom: 10px;
        color: #333;
      }
      .subtitle {
        color: #555;
        margin-bottom: 20px;
      }
      .section-title {
        font-size: 16px;
        font-weight: bold;
        margin-top: 25px;
        color: #1a73e8;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 10px;
      }
      table td {
        padding: 8px;
        border-bottom: 1px solid #ddd;
        vertical-align: top;
      }
      .label {
        color: #888;
        width: 200px;
        font-weight: bold;
      }
      .material-table {
        margin-top: 15px;
        border: 1px solid #ccc;
      }
      .material-table th {
        background: #1a73e8;
        color: white;
        padding: 8px;
        text-align: left;
      }
      .material-table td {
        padding: 8px;
        border-bottom: 1px solid #eee;
      }
      .footer {
        margin-top: 30px;
        text-align: center;
        color: #777;
        font-size: 12px;
      }
    </style>
  </head>

  <body>
    <div class="container">

      <div class="title">New Material Request</div>
      <div class="subtitle">A new material request has been submitted. See details below:</div>

      <div class="section-title">General Information</div>
      <table>
        <tr><td class="label">Requested By:</td><td>${user}</td></tr>
        <tr><td class="label">Creation Date:</td><td>${date}</td></tr>
        <tr><td class="label">Customer Name:</td><td>${customerName}</td></tr>
        <tr><td class="label">Request Type:</td><td>${requestType}</td></tr>
        <tr><td class="label">Delivery/Pickup Date:</td><td>${deliveryOrPickupDate}</td></tr>
      </table>

      ${
        requestType === "DELIVERY"
          ? `
      <div class="section-title">Delivery Address</div>
      <table>
        <tr><td class="label">Street:</td><td>${deliveryAddressStreet || ''}</td></tr>
        <tr><td class="label">City:</td><td>${deliveryAddressCity || ''}</td></tr>
        <tr><td class="label">Province:</td><td>${deliveryAddressProvince || ''}</td></tr>
        <tr><td class="label">Postal Code:</td><td>${deliveryAddressPostalCode || ''}</td></tr>
      </table>
      `
          : `
      <div class="section-title">Pickup Details</div>
      <p>The material will be picked up at the company.</p>
      `
      }

      ${
        deliveryInstruction
          ? `
      <div class="section-title">Delivery Instructions</div>
      <p>${deliveryInstruction}</p>
      `
          : ''
      }

      <div class="section-title">Material List</div>
      <table class="material-table">
        <thead>
          <tr>
            <th>Description</th>
            <th>Qty</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          ${material
            .map(
              (item) => `
            <tr>
              <td>${item.description}</td>
              <td>${item.quantity}</td>
              <td>${item.notes || ''}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>

      <div class="footer">
        This is an automated message. Please do not reply to this email.
      </div>

    </div>
  </body>
  </html>
  `;
};
