import { Op } from 'sequelize';
import * as Yup from 'yup';
import { getHours, parseISO, startOfDay, endOfDay } from 'date-fns';
import DeliveryMan from '../models/DeliveryMan';
import Delivery from '../models/Delivery';
import Recipient from '../models/Recipient';
import File from '../models/File';

class DeliveryStatusController {
  async index(req, res) {
    const { id } = req.params;
    const { page = 1, finished } = req.query;

    const deliveryman = await DeliveryMan.findByPk(id);

    if (!deliveryman) {
      return res.status(404).json({ error: 'Deliveryman not found!' });
    }

    if (finished) {
      const deliveries = await Delivery.findAll({
        where: {
          deliveryman_id: id,
          end_date: { [Op.not]: null },
          canceled_at: null,
        },
        limit: 10,
        offset: (page - 1) * 10,
        order: [['id', 'DESC']],
      });

      return res.json(deliveries);
    }

    const deliveries = await Delivery.findAll({
      where: {
        deliveryman_id: id,
        canceled_at: null,
        end_date: null,
      },
      limit: 10,
      offset: (page - 1) * 10,
      order: [['id', 'DESC']],
      include: [
        {
          model: Recipient,
          as: 'recipient',
          attributes: {
            exclude: ['createdAt', 'updatedAt'],
          },
        },
        {
          model: DeliveryMan,
          as: 'deliveryman',
          attributes: {
            exclude: ['createdAt', 'updatedAt'],
          },
          include: {
            model: File,
            as: 'avatar',
            attributes: ['name', 'path', 'url'],
          },
        },
      ],
    });

    return res.json(deliveries);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      start_date: Yup.date(),
      end_date: Yup.date(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails.' });
    }

    const { deliverymanId } = req.params;
    const deliveryman = await DeliveryMan.findByPk(deliverymanId);

    if (!deliveryman) {
      return res.status(404).json({ error: 'Deliveryman not found!' });
    }

    const { deliveryId } = req.params;
    const delivery = await Delivery.findByPk(deliveryId);

    if (!delivery) {
      return res.status(404).json({ error: 'Delivery does not exists!' });
    }

    const { start_date, end_date } = req.body;

    if (delivery.deliveryman_id !== Number(deliverymanId)) {
      return res.status(401).json({
        error: 'Deliveryman not authorized to take this package',
      });
    }

    if (start_date) {
      const dailyDeliveries = await Delivery.findAll({
        where: {
          deliveryman_id: deliverymanId,
          start_date: {
            [Op.between]: [
              startOfDay(parseISO(start_date)),
              endOfDay(parseISO(start_date)),
            ],
          },
        },
      });

      if (dailyDeliveries.length >= 5) {
        return res
          .status(401)
          .json({ error: 'Maximum daily number of deliveries reached' });
      }

      const startHour = getHours(parseISO(start_date));

      if (startHour < 8 || startHour >= 18) {
        return res.status(401).json({ error: 'Outside working hours' });
      }

      const { product, recipient_id, canceled_at } = await delivery.update({
        start_date,
      });

      return res.json({
        product,
        recipient_id,
        canceled_at,
        end_date: delivery.end_date,
        start_date,
      });
    }

    if (!start_date && !end_date) {
      return res.status(400).json({ error: 'No params are declared.' });
    }

    if (!req.file) {
      return res
        .status(401)
        .json({ error: 'You need to upload a file to end this delivery. ' });
    }

    const { originalname: name, filename: path } = req.file;

    const { id: signature_id } = await File.create({
      name,
      path,
    });

    const { id, product, recipient_id } = await delivery.update({
      end_date,
      signature_id,
    });

    return res.json({
      id,
      product,
      recipient_id,
      signature_id,
      end_date,
    });
  }
}

export default new DeliveryStatusController();
