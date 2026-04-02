const { z } = require('zod');

const registerSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(['user', 'pharmacy']).optional(),
    phone: z.string().optional(),
    pharmacyData: z.object({
        name: z.string(),
        address: z.string(),
        lat: z.number(),
        lng: z.number(),
        open_hours: z.string().optional()
    }).optional()
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string()
});

const medicationSchema = z.object({
    name: z.string().min(1),
    dosage: z.string().optional().nullable(),
    barcode: z.string().optional().nullable(),
    cost_price: z.number().nonnegative().optional(),
    price: z.number().positive(),
    quantity: z.number().int().nonnegative().optional(),
    min_stock_level: z.number().int().nonnegative().optional(),
    category: z.enum(['supplement', 'prescription', 'otc', 'beauty', 'equipment']),
    description: z.string().optional(),
    expiry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable().or(z.literal(''))
});

const saleSchema = z.object({
    medication_id: z.number().int().positive(),
    quantity: z.number().int().positive(),
    customer_id: z.number().int().positive().optional().nullable()
});

const batchSchema = z.object({
    batch_number: z.string().min(1),
    expiry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    quantity: z.number().int().positive()
});

const supplierSchema = z.object({
    name: z.string().min(1),
    contact_name: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
    address: z.string().optional()
});

module.exports = {
    registerSchema,
    loginSchema,
    medicationSchema,
    saleSchema,
    batchSchema,
    supplierSchema
};
