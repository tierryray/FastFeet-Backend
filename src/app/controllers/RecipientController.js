import * as Yup from 'yup';
import Recipient from '../models/Recipient';

class RecipientController {
  async index(req, res) {
    const { id } = req.params;

    if (id) {
      const recipient = await Recipient.findByPk(id, {
        attributes: { exclude: ['createdAt', 'updatedAt'] },
      });

      if (!recipient) {
        return res.status(400).json({ error: 'Recipient not found!' });
      }

      return res.json(recipient);
    }

    const recipients = await Recipient.findAll({
      attributes: { exclude: ['createdAt', 'updatedAt'] },
      order: [['id', 'DESC']],
    });

    return res.json(recipients);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      zipcode: Yup.string()
        .length(9)
        .required(),
      adress: Yup.string().required(),
      number: Yup.number().required(),
      city: Yup.string().required(),
      state: Yup.string().required(),
      complement: Yup.string(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation Fails' });
    }

    const {
      name,
      street,
      number,
      city,
      state,
      zipcode,
    } = await Recipient.create(req.body);

    return res.json({
      name,
      street,
      number,
      city,
      state,
      zipcode,
    });
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string(),
      zipcode: Yup.string().length(9),
      adress: Yup.string(),
      number: Yup.number(),
      city: Yup.string(),
      state: Yup.string(),
      complement: Yup.string(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation Fails' });
    }

    const recipient = await Recipient.findByPk(req.params.id);

    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found!' });
    }

    const {
      name,
      street,
      number,
      city,
      state,
      zipcode,
    } = await recipient.update(req.body);

    return res.json({
      name,
      street,
      number,
      city,
      state,
      zipcode,
    });
  }

  async delete(req, res) {
    const { id } = req.params;

    const recipient = await Recipient.findByPk(id, {
      attributes: { exclude: ['createdAt', 'updatedAt'] },
    });

    if (!recipient) {
      return res.status(400).json({ error: 'Recipient not found!' });
    }

    await recipient.destroy();

    const recipients = await Recipient.findAll({
      attributes: { exclude: ['createdAt', 'updatedAt'] },
    });

    return res.json(recipients);
  }
}

export default new RecipientController();
