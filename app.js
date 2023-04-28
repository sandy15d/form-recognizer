const express = require('express');
const { AzureKeyCredential, DocumentAnalysisClient } = require("@azure/ai-form-recognizer");

const app = express();
const port = 3000;

const key = "f0dafd6904664d6499ac63b6802534e1";
const endpoint = "https://sandy15d.cognitiveservices.azure.com/";

//url ="https://scanold.doctechno.in/uploads/temp/1682592903.pdf";
app.get('/', async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ message: "Please provide a valid URL" });
  }

  try {
    const client = new DocumentAnalysisClient(endpoint, new AzureKeyCredential(key));
    const poller = await client.beginAnalyzeDocument("prebuilt-invoice", url);
    const {
      documents: [result]
    } = await poller.pollUntilDone();
  
    if (result) {
      const invoice = result.fields;
  
      const invoiceDetails = {
        vendorName: invoice.VendorName?.content,
        customerName: invoice.CustomerName?.content,
        invoiceDate: invoice.InvoiceDate?.content,
        dueDate: invoice.DueDate?.content,
        items: [],
        subtotal: invoice.SubTotal?.content,
        previousUnpaidBalance: invoice.PreviousUnpaidBalance?.content,
        totalTax: invoice.TotalTax?.content,
        amountDue: invoice.AmountDue?.content,
      };
  
      for (const { properties: item } of invoice.Items?.values ?? []) {
        const itemDetails = {
          productCode: item.ProductCode?.content ?? "<no product code>",
          description: item.Description?.content,
          quantity: item.Quantity?.content,
          date: item.Date?.content,
          unit: item.Unit?.content,
          unitPrice: item.UnitPrice?.content,
          tax: item.Tax?.content,
          amount: item.Amount?.content,
        };
  
        invoiceDetails.items.push(itemDetails);
      }
  
      res.json(invoiceDetails);
    } else {
      res.status(400).json({ message: "No invoice found" });
    }
  } catch (error) {
    console.error("An error occurred:", error);
    res.status(500).json({ message: "An error occurred" });
  }
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
