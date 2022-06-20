import { Web3Storage, Blob, File } from "web3.storage";
import Patch from "@patch-technology/patch";

const patch = Patch(process.env.PATCH_API_KEY);

export default async function handler(req, res) {
  console.log({ req });

  const { key } = req.query;
  const { price, patchProjectId } = req.body;
  if (!price) {
    return res.status(400).json({
      success: false,
      data: {
        mass_g: 0,
        token_uri: `error://price%20not%20set`,
        project: `error://price%20not%20set`,
      },
    });
  }
  if (!patchProjectId) {
    // projectId = [pro_test_9fdc93f66dba9cdfacbceac9f2648a01]
    // throw new Error("enter a project id");
    return res.status(404).json({
      success: false,
      data: {
        mass_g: 0,
        token_uri: `error://project%20not%20found`,
        project: `error://project%20not%20found`,
      },
    });
  }
  if (key == null || key !== process.env.BUY_API_KEY) {
    return res.status(401).json({
      success: false,
      data: {
        mass_g: 0,
        token_uri: `error://missing%20api%20key`,
        project: `error://missing%20api%20key`,
      },
    });
  }
  /*
  if (req.method != "POST") {
    res.status(405).json({ err: "only post allowed" });
  } else {
    createPatchOrder(quantity).then((data) => res.status(200).json(data));
  }
  */

  const order = await createPatchOrder(price, patchProjectId);

  //display patch projects
  //console.log(await patch.projects.retrieveProjects());

  const cost = order.data.price;
  const project = order.data.inventory.shift().project.name;

  const { mass_g, registry_url } = order.data;
  const metadata = {
    name: `${mass_g}g of ${project}`,
    image:
      "ipfs://bafybeiaiezebtrtxvpyqtbalq2t4j7d3zivqu2ptc6hk42uwbf7cnblsqu/snap2022-02-26-03-00-49.png",
    animation_url: registry_url,
    attributes: [
      {
        trait_type: "type",
        value: "reciept",
      },
      {
        trait_type: "cost",
        value: cost,
      },
      {
        display_type: "boost_number",
        trait_type: "mass in grams",
        value: mass_g,
      },
    ],
  };
  // console.log({ metadata });
  const storage = new Web3Storage({ token: process.env.STORAGE_API_KEY });
  const blob = new Blob([JSON.stringify(metadata)], {
    type: "application/json",
  });
  const cid = await storage.put([new File([blob], "metadata.json")]);
  res.status(201).json({
    success: true,
    data: {
      mass_g: order.data.mass_g,
      token_uri: `ipfs://${cid}/metadata.json`,
      project,
    },
  });
}

let createPatchOrder = async (totalPrice, patchProjectId) => {
  try {
    const currency = "USD";
    const order = await patch.orders.createOrder({
      total_price: totalPrice,
      currency: currency,
      project_id: patchProjectId,
    });
    return order;
  } catch (err) {
    console.log(err);
  }
};
