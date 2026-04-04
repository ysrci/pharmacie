const CustomerService = require('../services/CustomerService');
const { z } = require('zod');

const customerSchema = z.object({
    name: z.string().min(1),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal(''))
});

class CustomerController {
    static async getAll(req, res, next) {
        try {
            const customers = await CustomerService.getAll(req.user.pharmacyId);
            res.json(customers);
        } catch (err) {
            next(err);
        }
    }

    static async getDetail(req, res, next) {
        try {
            const customer = await CustomerService.getById(req.user.pharmacyId, req.params.id);
            if (!customer) {
                const error = new Error('Customer not found');
                error.status = 404;
                throw error;
            }
            res.json(customer);
        } catch (err) {
            next(err);
        }
    }

    static async create(req, res, next) {
        try {
            const validatedData = customerSchema.parse(req.body);
            const customer = await CustomerService.create(req.user.pharmacyId, validatedData);
            res.json(customer);
        } catch (err) {
            next(err);
        }
    }

    static async update(req, res, next) {
        try {
            const validatedData = customerSchema.partial().parse(req.body);
            const customer = await CustomerService.update(req.user.pharmacyId, req.params.id, validatedData);
            res.json(customer);
        } catch (err) {
            next(err);
        }
    }
}

module.exports = CustomerController;
