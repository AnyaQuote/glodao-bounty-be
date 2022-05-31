const UNKNOWN_ERROR = "Unknown error! Please try again later";
const INVALID_REF_URL_ERROR = "Invalid URL! Please user your referral link";
const ALREADY_LINKED_ERROR =
  "Your telegram account had already been linked with an account";
const INVALID_REF_LINK_ERROR = "Invalid referral link!";
const NOT_LINKED_ERROR =
  "Your telegram account has not been linked with any account yet";

const LINK_SUCCESS = "Account linked successfully";
const UNLINK_SUCCESS = "Account unlinked successfully";

const REF_LINK_FORMAT_REQUIRED =
  "Please provide your referral link with the following format:\n/link your_referral_link";
const HELP_MESSAGE =
  "I can help you link your telegram account with your GloDAO bounty app account. \nWith me you will be able to finish Telegram task on bounty app!\n\nYou can control me by sending these commands:\n\n<a>/link</a> - Link your telegram account with your bounty app account\n<a>/unlink</a> - Unlink your telegram account\n";

module.exports = {
  UNKNOWN_ERROR,
  INVALID_REF_URL_ERROR,
  ALREADY_LINKED_ERROR,
  INVALID_REF_LINK_ERROR,
  LINK_SUCCESS,
  UNLINK_SUCCESS,
  NOT_LINKED_ERROR,
  REF_LINK_FORMAT_REQUIRED,
  HELP_MESSAGE,
};
