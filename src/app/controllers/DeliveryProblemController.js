import * as Yup from 'yup';
import DeliveryProblem from '../models/DeliveryProblem';
import Delivery from '../models/Delivery';
import DeliveryMan from '../models/DeliveryMan';
import File from '../models/File';

import CancellationDeliveryMail from '../jobs/CancellationDeliveryMail';
import Queue from '../../lib/Queue';

class DeliveryProblemController {
  async index(req, res) {
    const { id } = req.params;
    const { page = 1 } = req.query;

    if (id) {
      const deliveryWithProblem = await DeliveryProblem.findOne({
        where: {
          delivery_id: id,
        },
      });

      if (!deliveryWithProblem) {
        return res.status(404).json({ error: 'Delivery not found!' });
      }

      return res.json(deliveryWithProblem);
    }

    const deliveriesWithProblem = await DeliveryProblem.findAll({
      include: {
        model: Delivery,
        as: 'delivery',
        attributes: {
          exclude: ['createdAt', 'updatedAt'],
        },
      },
      limit: 10,
      offset: (page - 1) * 10,
      order: [['delivery_id', 'DESC']],
    });

    return res.json(deliveriesWithProblem);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      description: Yup.string().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails.' });
    }

    const { id } = req.params;

    const delivery = await Delivery.findByPk(id);

    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found!' });
    }

    const { description } = req.body;

    const deliveryWithProblem = await DeliveryProblem.create({
      delivery_id: id,
      description,
    });

    return res.json(deliveryWithProblem);
  }

  async delete(req, res) {
    const { id } = req.params;

    const deliveryWithProblem = await DeliveryProblem.findByPk(id);

    if (!deliveryWithProblem) {
      return res
        .status(404)
        .json({ error: 'Delivery with problem not found!' });
    }

    const delivery = await Delivery.findOne({
      where: {
        id: deliveryWithProblem.delivery_id,
      },
      include: {
        model: DeliveryMan,
        as: 'deliveryman',
        include: {
          model: File,
          as: 'avatar',
        },
      },
    });

    await delivery.update({
      canceled_at: new Date(),
    });

    await Queue.add(CancellationDeliveryMail.key, {
      delivery,
      deliveryman: delivery.deliveryman,
    });

    return res.json(delivery);
  }
}

export default new DeliveryProblemController();
