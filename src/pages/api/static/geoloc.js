import axios from 'axios';
import { getGeoIp } from './geoip';

export default async function handler(req, res) {
  try {
    let baseUrl = `${process.env.NEXT_PUBLIC_NEXUS_BASE_URL}/network/list/nodes/address,latency`;
    if (req.query.network == 'Testnet') {
      baseUrl = `${process.env.NEXT_PUBLIC_TESTNET_BASE_URL}/network/list/nodes/address,latency`;
    }

    const nodesList = await axios.post(baseUrl, req.query);

    let responsePromises = [];
    // .slice(0, 100)
    nodesList.data.result.forEach((node) => {
      responsePromises.push(
        getGeoIp(node.address).catch((err) => {
          // Handle error or rejection here, e.g. return a default value or a structured error response
          console.error(
            `Failed to get geolocation for node ${node.address}: ${err}`
          );
          return { location: { lat: 0, lng: 0 } };
        })
      );
    });

    Promise.allSettled(responsePromises).then((results) => {
      const packedData = [];
      results.forEach((result, index) => {
        if (result.status !== 'fulfilled') return;
        const { latitude, longitude } = result.value.location;
        const { latency } = nodesList.data.result[index];
        packedData.push({ latitude, longitude, latency });
      });
      res.json(packedData);
    });
  } catch (err) {
    console.error(`Failed to fetch nodes list: ${err}`);
    res.status(500).json({ error: 'Failed to fetch nodes list' });
  }
}
