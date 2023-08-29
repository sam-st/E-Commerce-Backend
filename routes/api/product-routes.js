const router = require('express').Router();
const { Product, Category, Tag, ProductTag } = require('../../models');

// The `/api/products` endpoint

// get all products
router.get('/', async (req, res) => {
  try {
    const productData = await Product.findAll({
      include: [
        { model: Category },
        { model: Tag, through: ProductTag }
      ]
    });
    res.status(200).json(productData);
  } catch (err) {
    res.status(500).json(err);
  }
});

// get one product
router.get('/:id', async (req, res) => {
  try {
    const productData = await Product.findByPk(req.params.id, {
      include: [
        { model: Category },
        { model: Tag, through: ProductTag }
      ]
    });

    if (!productData) {
      res.status(404).json({ message: 'No product found with that id!' });
      return;
    }

    res.status(200).json(productData);
  } catch (err) {
    res.status(500).json(err);
  }
});

// create new product
router.post('/', async (req, res) => {
  try {
    const product = await Product.create(req.body);

    if (req.body.tagIds.length) {
      const productTagIdArr = req.body.tagIds.map(tag_id => ({
        product_id: product.id,
        tag_id,
      }));
      await ProductTag.bulkCreate(productTagIdArr);
    }

    res.status(201).json(product); //201 means created.
  } catch (err) {
    console.log(err);
    res.status(400).json(err);
  }
});

// update product
router.put('/:id', async (req, res) => { 
  try {
    const { id } = req.params;
    const [affectedRows] = await Product.update(req.body, { where: { id } });

    if (req.body.tagIds && req.body.tagIds.length) {
      const productTags = await ProductTag.findAll({ where: { product_id: id } });
      
      const existingTagIds = productTags.map(({ tag_id }) => tag_id);
      
      const newTagIds = req.body.tagIds.filter(tag_id => !existingTagIds.includes(tag_id));

      const newProductTags = newTagIds.map(tag_id => ({ product_id: id, tag_id }));
      
      const tagsToRemove = productTags.filter(({ tag_id }) => !req.body.tagIds.includes(tag_id));

      const tagIdsToRemove = tagsToRemove.map(({ id }) => id);

      await Promise.all([
        ProductTag.destroy({ where: { id: tagIdsToRemove } }),
        ProductTag.bulkCreate(newProductTags)
      ]);
    }

    if (affectedRows === 0) {
      res.status(404).json({ message: 'No product found with that id!' });
    } else {
      res.status(200).json({ message: 'Product updated successfully' });
    }
  } catch (err) {
    res.status(400).json(err);
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const productData = await Product.destroy({
      where: {
        id: req.params.id,
      },
    });

    if (!productData) {
      res.status(404).json({ message: 'No product found with that id!' });
      return;
    }

    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
