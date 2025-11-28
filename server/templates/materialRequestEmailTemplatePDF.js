const path = require("path");
const PdfPrinter = require("pdfmake");

const fonts = {
  Roboto: {
    normal: path.join(__dirname, "..", "fonts", "Roboto-Regular.ttf"),
    bold: path.join(__dirname, "..", "fonts", "Roboto-Medium.ttf"),
    italics: path.join(__dirname, "..", "fonts", "Roboto-Italic.ttf"),
    bolditalics: path.join(__dirname, "..", "fonts", "Roboto-MediumItalic.ttf")
  }
};

const printer = new PdfPrinter(fonts);

module.exports = function materialRequestPdfTemplatePDF(data) {
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
const docDefinition = {
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60], // left, top, right, bottom
    header: {
      text: "Material Request",
      style: "header",
      alignment: "center",
      margin: [0, 10, 0, 10]
    },
    footer: (currentPage, pageCount) => ({
      columns: [
        { text: "CarpentryGO!", alignment: "left", italics: true, margin: [40, 0] },
        { text: `Page ${currentPage} of ${pageCount}`, alignment: "right", margin: [0, 0, 40, 0] }
      ]
    }),
    content: [
      { text: "Created By: " + user, margin: [0, 0, 0, 5] },
      { text: "Date: " + date, margin: [0, 0, 0, 10] },

      { text: "Customer Information", style: "sectionHeader" },
      {
        table: {
          widths: ["auto", "*"],
          body: [
            ["Customer Name:", customerName],
            ["Request Type:", requestType],
            ["Delivery/Pickup Date:", deliveryOrPickupDate]
          ]
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 20]
      },

      ...(requestType.toLowerCase() === "delivery" ? [
        { text: "Delivery Address", style: "sectionHeader" },
        {
          table: {
            widths: ["auto", "*"],
            body: [
              ["Street:", deliveryAddressStreet || ""],
              ["City:", deliveryAddressCity || ""],
              ["Province:", deliveryAddressProvince || ""],
              ["Postal Code:", deliveryAddressPostalCode || ""]
            ]
          },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 20]
        }
      ] : []),

      { text: "Delivery Instructions", style: "sectionHeader" },
      { text: deliveryInstruction || "None", margin: [0, 0, 0, 20] },

      { text: "Materials", style: "sectionHeader" },
      {
        table: {
          headerRows: 1,
          widths: ["*", "auto", "*"],
          body: [
            [
              { text: "Description", bold: true, fillColor: "#eeeeee" },
              { text: "Qty", bold: true, fillColor: "#eeeeee" },
              { text: "Notes", bold: true, fillColor: "#eeeeee" }
            ],
            ...material.map(m => [
              m.description ?? "",
              m.quantity ?? "",
              m.notes ?? ""
            ])
          ]
        },
        layout: {
          fillColor: (rowIndex) => rowIndex % 2 === 0 ? "#ffffff" : "#f9f9f9"
        }
      }
    ],

    defaultStyle: {
      font: "Roboto",
      fontSize: 11
    },

    styles: {
      header: { fontSize: 20, bold: true, color: "#2c3e50" },
      sectionHeader: { fontSize: 14, bold: true, margin: [0, 15, 0, 8], color: "#34495e" }
    }
  };

  return printer.createPdfKitDocument(docDefinition);
};