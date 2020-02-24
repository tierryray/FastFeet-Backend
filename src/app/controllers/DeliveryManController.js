import * as Yup from 'yup';
import DeliveryMan from '../models/DeliveryMan';
import File from '../models/File';

class DeliveryManController {
  async store(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string()
        .email()
        .required(),
      avatar_id: Yup.number(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { avatar_id, email } = req.body;

    const file = await File.findOne({ where: { id: avatar_id } });

    if (!file) {
      return res.status(400).json({ error: 'File not found!' });
    }

    const userExists = await DeliveryMan.findOne({ where: { email } });

    if (userExists) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const deliveryMan = await DeliveryMan.create(req.body);

    return res.json(deliveryMan);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string(),
      email: Yup.string().email(),
      avatar_id: Yup.number(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const deliveryman = await DeliveryMan.findByPk(req.params.id);

    if (!deliveryman) {
      return res.status(400).json({ error: 'Deliveryman not found' });
    }

    const { email } = req.body;

    if (email && email !== deliveryman.email) {
      const userExists = await DeliveryMan.findOne({ where: { email } });

      if (userExists) {
        return res
          .status(400)
          .json({ error: 'The email provided is already being used' });
      }
    }

    const { avatar_id } = req.body;

    if (avatar_id) {
      const file = await File.findOne({ where: { id: avatar_id } });

      if (!file) {
        return res.status(400).json({ error: 'Avatar file not found!' });
      }
    }

    const { id, name } = await deliveryman.update(req.body);

    return res.json({
      id,
      name,
      email,
      avatar_id,
    });
  }

  async index(req, res) {
    const { id } = req.params;

    if (id) {
      const deliveryman = await DeliveryMan.findOne({
        where: { id },
        include: [
          { model: File, as: 'avatar', attributes: ['name', 'path', 'url'] },
        ],
      });

      if (!deliveryman) {
        return res.status(400).json({ error: 'Deliveryman not found' });
      }

      return res.json(deliveryman);
    }

    const deliverymans = await DeliveryMan.findAll({
      include: [
        { model: File, as: 'avatar', attributes: ['name', 'path', 'url'] },
      ],
      order: [['id', 'DESC']],
    });

    if (!deliverymans) {
      return res.status(400).json({ error: 'Deliverymans not founded' });
    }

    return res.json(deliverymans);
  }

  async delete(req, res) {
    const { id } = req.params;

    const deliveryman = await DeliveryMan.findByPk(id);

    if (!deliveryman) {
      return res.status(400).json({ error: 'Deliveryman not exists' });
    }

    await deliveryman.destroy();

    const deliverymans = await DeliveryMan.findAll({
      attributes: ['id', 'name', 'email', 'avatar_id'],
      order: [['id', 'DESC']],
    });

    return res.json(deliverymans);
  }
}

export default new DeliveryManController();
