import axios from 'axios';

export const getFoodByBarcode = async (req, res) => {
  const { barcode } = req.params;

  try {
    const response = await axios.get(`${process.env.OPENFOODFACTS_API_BASE}/${barcode}.json`);

    if (response.data && response.data.status === 1) {
      // Product found
      res.json(response.data.product);
    } else {
      res.status(404).json({ message: 'Food not found' });
    }

  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error fetching food info' });
  }
};
