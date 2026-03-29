const CustomerService = require('../services/CustomerService');
const { z } = require('zod');

const customerSchema = z.object({
    name: z.string().min(1),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal(''))
});

class CustomerController {
    static async getAll(req, res) {
        try {
            const customers = await CustomerService.getAll(req.user.pharmacyId);
            res.json(customers);
        } catch (err) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    static async getDetail(req, res) {
        try {
            const customer = await CustomerService.getById(req.user.pharmacyId, req.params.id);
            if (!customer) return res.status(404).json({ error: 'Customer not found' });
            res.json(customer);
        } catch (err) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    static async create(req, res) {
        try {
            const validatedData = customerSchema.parse(req.body);
            const customer = await CustomerService.create(req.user.pharmacyId, validatedData);
            res.json(customer);
        } catch (err) {
            res.status(400).json({ error: err.errors ? err.errors : err.message });
        }
    }

    static async update(req, res) {
        try {
            const validatedData = customerSchema.partial().parse(req.body);
            const customer = await CustomerService.update(req.user.pharmacyId, req.params.id, validatedData);
            res.json(customer);
        } catch (err) {
            res.status(400).json({ error: err.errors ? err.errors : err.message });
        }
    }
}

module.exports = CustomerController;
