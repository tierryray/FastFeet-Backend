import * as Yup from 'yup';
import { Op } from 'sequelize';

import Delivery from '../models/Delivery';
import Recipient from '../models/Recipient';
import DeliveryMan from '../models/DeliveryMan';
import File from '../models/File';

import NewDeliveryMail from '../jobs/NewDeliveryMail';
import Queue from '../../lib/Queue';

class DeliveryController {
  async index(req, res) {
    const { page, q } = req.query;
    const { id } = req.params;

    if (id) {
      const delivery = await Delivery.findByPk(id, {
        attributes: {
          exclude: [
            'createdAt',
            'updatedAt',
            'signature_id',
            'recipient_id',
            'deliveryman_id',
            'path',
          ],
        },
        include: [
          {
            model: File,
            as: 'signature',
            attributes: { exclude: ['createdAt', 'updatedAt'] },
          },
          {
            model: Recipient,
            as: 'recipient',
            attributes: { exclude: ['createdAt', 'updatedAt'] },
          },
          {
            model: DeliveryMan,
            as: 'deliveryman',
            attributes: { exclude: ['createdAt', 'updatedAt', 'avatar_id'] },
            include: {
              model: File,
              as: 'avatar',
              attributes: ['name', 'path'],
            },
          },
        ],
      });

      if (!delivery) {
        return res.status(400).json({ error: 'Delivery not found!' });
      }

      return res.json(delivery);
    }

    if (q) {
      const deliveries = await Delivery.findAll({
        where: {
          product: {
            [Op.like]: `%${q}%`,
          },
        },
        attributes: {
          exclude: [
            'createdAt',
            'updatedAt',
            'signature_id',
            'recipient_id',
            'deliveryman_id',
            'path',
          ],
        },
        include: [
          {
            model: File,
            as: 'signature',
            attributes: { exclude: ['createdAt', 'updatedAt'] },
          },
          {
            model: Recipient,
            as: 'recipient',
            attributes: { exclude: ['createdAt', 'updatedAt'] },
          },
          {
            model: DeliveryMan,
            as: 'deliveryman',
            attributes: { exclude: ['createdAt', 'updatedAt', 'avatar_id'] },
            include: {
              model: File,
              as: 'avatar',
              attributes: ['name', 'path'],
            },
          },
        ],
      });

      return res.json(deliveries);
    }

    const deliveries = await Delivery.findAll({
      attributes: {
        exclude: [
          'createdAt',
          'updatedAt',
          'signature_id',
          'recipient_id',
          'deliveryman_id',
          'path',
        ],
      },
      limit: 20,
      offset: (page - 1) * 20,
      order: [['id', 'DESC']],
      include: [
        {
          model: File,
          as: 'signature',
          attributes: { exclude: ['createdAt', 'updatedAt'] },
        },
        {
          model: Recipient,
          as: 'recipient',
          attributes: { exclude: ['createdAt', 'updatedAt'] },
        },
        {
          model: DeliveryMan,
          as: 'deliveryman',
          attributes: { exclude: ['createdAt', 'updatedAt', 'avatar_id'] },
          include: {
            model: File,
            as: 'avatar',
            attributes: ['name', 'path'],
          },
        },
      ],
    });

    return res.json(deliveries);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      product: Yup.string().required(),
      recipient_id: Yup.number().required(),
      deliveryman_id: Yup.number().required(),
      signature_id: Yup.number(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { recipient_id, deliveryman_id } = req.body;

    const recipient = await Recipient.findByPk(recipient_id, {
      attributes: [
        'name',
        'adress',
        'number',
        'complement',
        'city',
        'state',
        'zipcode',
      ],
    });

    if (!recipient) {
      return res.status(400).json({ error: 'Recipient not found!' });
    }

    const deliveryman = await DeliveryMan.findByPk(deliveryman_id, {
      attributes: ['name', 'email'],
      include: {
        model: File,
        as: 'avatar',
        attributes: ['name', 'url'],
      },
    });

    if (!deliveryman) {
      return res.status(400).json({ error: 'Deliveryman not found!' });
    }

    const delivery = await Delivery.create(req.body);

    await Queue.add(NewDeliveryMail.key, {
      delivery,
      deliveryman,
    });

    return res.json({
      id: delivery.id,
      product: delivery.product,
      recipient,
      deliveryman,
    });
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      recipient_id: Yup.number(),
      deliveryman_id: Yup.number(),
      signature_id: Yup.number(),
      product: Yup.string(),
      canceled_at: Yup.date(),
      start_date: Yup.date(),
      end_date: Yup.date(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { id } = req.params;

    const delivery = await Delivery.findByPk(id);

    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found!' });
    }

    const { recipient_id, deliveryman_id, signature_id } = req.body;

    if (recipient_id) {
      const recipient = await Recipient.findByPk(recipient_id);

      if (!recipient) {
        return res.status(404).json({ error: 'Recipient not found!' });
      }
    }

    if (deliveryman_id) {
      const deliveryman = await DeliveryMan.findByPk(deliveryman_id);

      if (!deliveryman) {
        return res.status(404).json({ error: 'Deliveryman not found!' });
      }
    }

    if (signature_id) {
      const signature = await File.findByPk(signature_id);

      if (!signature) {
        return res.status(404).json({ error: 'Signature not found!' });
      }
    }

    await delivery.update(req.body);

    return res.json(delivery);
  }

  async delete(req, res) {
    const { id } = req.params;

    const delivery = await Delivery.findByPk(id);

    if (!delivery) {
      return res.status(400).json({ error: 'Delivery not found!' });
    }

    await delivery.destroy();

    const deliveries = await Delivery.findAll({
      attributes: {
        exclude: [
          'canceled_at',
          'createdAt',
          'updatedAt',
          'signature_id',
          'recipient_id',
          'deliveryman_id',
          'path',
        ],
      },
      order: [['id', 'DESC']],
      include: [
        {
          model: File,
          as: 'signature',
          attributes: { exclude: ['createdAt', 'updatedAt'] },
        },
        {
          model: Recipient,
          as: 'recipient',
          attributes: { exclude: ['createdAt', 'updatedAt'] },
        },
        {
          model: DeliveryMan,
          as: 'deliveryman',
          attributes: { exclude: ['createdAt', 'updatedAt', 'avatar_id'] },
          include: {
            model: File,
            as: 'avatar',
            attributes: ['name', 'path'],
          },
        },
      ],
    });

    return res.json(deliveries);
  }
}

export default new DeliveryController();
