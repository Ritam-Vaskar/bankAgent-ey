export function validateName(name) {
  if (!name || typeof name !== "string") return false
  // Allow only letters and spaces, no numbers
  return /^[a-zA-Z\s]+$/.test(name.trim()) && name.trim().length > 2
}

export function validateDOB(dob) {
  if (!dob || typeof dob !== "string") return false
  const regex = /^\d{4}-\d{2}-\d{2}$/
  if (!regex.test(dob)) return false

  const date = new Date(dob)
  if (isNaN(date.getTime())) return false

  const age = new Date().getFullYear() - date.getFullYear()
  const monthDiff = new Date().getMonth() - date.getMonth()
  const dayDiff = new Date().getDate() - date.getDate()

  const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age
  return actualAge >= 18
}

export function validatePhone(phone) {
  if (!phone || typeof phone !== "string") return false
  // Indian phone number: 10 digits starting with 6-9
  return /^[6-9]\d{9}$/.test(phone)
}

export function validateAddress(address) {
  if (!address || typeof address !== "string") return false
  return address.trim().length >= 10
}

export function validateAadhaar(aadhaar) {
  if (!aadhaar || typeof aadhaar !== "string") return false
  // 12-digit Aadhaar
  return /^\d{12}$/.test(aadhaar)
}

export function validatePAN(pan) {
  if (!pan || typeof pan !== "string") return false
  // PAN format: [A-Z]{5}[0-9]{4}[A-Z]{1}
  return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)
}
