// controllers/productsController.js
const Product = require("../models/productModel");
const OpenAI = require("openai");
const fs = require("fs");

const openai = new OpenAI({
  apiKey: "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",
});

async function getAllProducts(req, res) {
  try {
    const products = await Product.find();

    // Convert image filenames to URLs
    const productsWithUrls = products.map((product) => {
      return {
        ...product._doc,
        image: product.image, // Use the stored URL directly
      };
    });

    res.json(productsWithUrls);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function getProductById(req, res, next) {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.product = product;
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// async function createProduct(req, res) {
//   const { title, price, category } = req.body;

//   if (!title || !price || !category) {
//     return res
//       .status(400)
//       .json({ message: "Title, price, and category are required" });
//   }

//   const imageFilename = req.file ? req.file.filename : null;
//   const imageUrl = imageFilename
//     ? `${req.protocol}://${req.get("host")}/uploads/${encodeURIComponent(
//         imageFilename
//       )}`
//     : null;

//   const product = new Product({
//     title,
//     image: imageUrl,
//     price,
//     category,
//   });

//   try {
//     const newProduct = await product.save();
//     res.status(201).json(newProduct);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// }

function encodeImage(imagePath) {
  const image = fs.readFileSync(imagePath);
  const base64Image = Buffer.from(image).toString("base64");
  return `data:image/jpeg;base64,${base64Image}`;
}

async function createProduct(req, res) {
  const { title, price, category } = req.body;

  if (!title || !price || !category) {
    return res
      .status(400)
      .json({ message: "Title, price, and category are required" });
  }

  const imageFilename = req.file ? req.file.filename : null;
  const imageUrl = imageFilename
    ? `/uploads/${encodeURIComponent(imageFilename)}`
    : null;

  const imageUrl2 = imageFilename
    ? `D:/ecommerce_ai/uploads/${encodeURIComponent(imageFilename)}`
    : null;

  // Getting the data URL
  const dataUrl = encodeImage(imageUrl2);

  // Call OpenAI GPT-4 Vision API
  const visionApiResponse = await getVisionData(dataUrl);

  const tagsArray = visionApiResponse.trim().split(",");

  console.log(tagsArray);

  console.log("----->visionApiResponse");
  console.log(visionApiResponse);

  const product = new Product({
    title,
    image: imageUrl,
    price,
    category,
    visionData: tagsArray, // Assuming the relevant data is in 'data' property
  });

  try {
    const newProduct = await product.save();
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

// Helper function to call OpenAI GPT-4 Vision API
async function getVisionData(imageUrl) {
  const response = await openai.chat.completions.create({
    model: "gpt-4-vision-preview",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Please describe the person fashion with only keywords and don't add dot in end and remove space after comma.`,
          },
          {
            type: "image_url",
            image_url: {
              url: imageUrl,
            },
          },
        ],
      },
    ],
    max_tokens: 1000,
  });
  console.log(response.choices[0]);
  console.log(response.choices[0]["message"]["content"]);
  return response.choices[0]["message"]["content"];
}

async function updateProduct(req, res) {
  try {
    if (req.body.title != null) {
      res.product.title = req.body.title;
    }
    if (req.file) {
      res.product.image = req.file.filename;
    }
    if (req.body.price != null) {
      res.product.price = req.body.price;
    }
    if (req.body.category != null) {
      res.product.category = req.body.category;
    }

    const updatedProduct = await res.product.save();
    res.json(updatedProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

async function deleteProduct(req, res) {
  try {
    const productId = req.params.id;

    // Use the Product model to find and delete the product
    const deletedProduct = await Product.findByIdAndDelete(productId);

    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
