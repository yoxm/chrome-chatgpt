export function uniqueID(): string {
  let timestamp = new Date().getTime().toString(16); // convert current time to hexadecimal string
  let random = Math.random().toString(16).substring(2); // generate a random hexadecimal string
  return `${timestamp}-${random}`; // concatenate the timestamp and random string to create a unique id
}
