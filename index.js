const express = require('express')
const bodyParser = require('body-parser');
const app = express()
const port = 3000

app.use(bodyParser.urlencoded());
app.use(bodyParser.json());
const { AzureKeyCredential, DocumentAnalysisClient } = require("@azure/ai-form-recognizer");
const key = "f0dafd6904664d6499ac63b6802534e1";
const endpoint = "https://sandy15d.cognitiveservices.azure.com/";

// sample document
const invoiceUrl = "https://scanold.doctechno.in/uploads/temp/1682592903.pdf";

app.post('/', async (req, res) => {
    try {
        const {doc_type,url} = req.body;
        const data = await myfunction(doc_type,url);
        res.send(data);
    } catch (err) {
        console.log(err);
    }
})


const myfunction = async (doc_type,url) => {
    const client = new DocumentAnalysisClient(endpoint, new AzureKeyCredential(key));
    const poller = await client.beginAnalyzeDocument("prebuilt-invoice", invoiceUrl);
    const {documents: [result] } = await poller.pollUntilDone();

    let finalResult;
    if (result) {
        const invoice = result.fields;
        finalResult = {
            "Invoice Number": invoice.InvoiceNumber?.content,
            "Vendor Name": invoice.VendorName?.content,
            "Customer Name": invoice.CustomerName?.content,
            "Invoice Date": invoice.InvoiceDate?.content,
            "Due Date": invoice.DueDate?.content,
        }

        
        let itemArray = [];
        for (const { properties: item} of invoice.Items?.values ?? []) {
            itemArray.push({
                "Product Code": item.ProductCode?.content,
                "Description": item.Description?.content,
                "Quantity": item.Quantity?.content,
                "Date": item.Date?.content,
                "Unit": item.Unit?.content,
                "Unit Price": item.UnitPrice?.content,
                "Tax": item.Tax?.content,
                "Amount": item.Amount?.content,
            });
        }
        finalResult['items'] = itemArray;
        
        finalResult["Subtotal"] = invoice.SubTotal?.content;
        finalResult["Previous Unpaid Balance"] = invoice.PreviousUnpaidBalance?.content;
        finalResult["Tax"] = invoice.TotalTax?.content;
        finalResult["Amount Due:"] = invoice.AmountDue?.content;

        return finalResult;
    } else {
        throw new Error("Expected at least one receipt in the result.");
    }
}


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})







