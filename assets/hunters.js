const hunters = [];

const addHunter = (hunter) => {
  hunters.push(hunter);
};

const addHunters = (hunters) => {
  hunters.forEach((hunter) => {
    addHunter(hunter);
  });
};

const getHunters = () => {
  return JSON.parse(JSON.stringify(hunters));
};

const getHunter = (hunterId) => {
  return JSON.parse(
    JSON.stringify(
      hunters.find((hunter) => {
        return hunter.id === hunterId;
      })
    )
  );
};

const getHunterByReferralCode = (referralCode) => {
  return JSON.parse(
    JSON.stringify(
      hunters.find((hunter) => {
        return hunter.referralCode === referralCode;
      })
    )
  );
};

const updateHunter = (hunterId, hunter) => {
  const index = hunters.findIndex((h) => {
    return h.id === hunterId;
  });
  hunters[index] = hunter;
};

const deleteHunter = (hunterId) => {
  const index = hunters.findIndex((h) => {
    return h.id === hunterId;
  });
  hunters.splice(index, 1);
};

module.exports = {
  addHunter,
  addHunters,
  getHunters,
  getHunter,
  getHunterByReferralCode,
  updateHunter,
  deleteHunter,
};
