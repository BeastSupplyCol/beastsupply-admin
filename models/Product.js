import mongoose, { Schema, model, models } from "mongoose";

const weightAndPriceSchema = new Schema({
    weight: { type: String, required: true },
    priceUnit: { type: Number, required: true }, // Cambiado a priceUnit
});

const productSchema = new Schema({
    title: { type: String, required: true },
    description: String,
    price: { type: Number, required: true }, // Price fuera de weightAndPrices
    priceCOL: { type: Number, required: true },
    weightAndPrices: [weightAndPriceSchema],
    flavors: [{ type: String }],
    images: [{ type: String }],
    category: { type: mongoose.Types.ObjectId, ref: 'Category' },
    properties: { type: Object },
}, {
    timestamps: true,
});

export const Product = models.Product || model('Product', productSchema);
