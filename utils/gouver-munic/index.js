import { getUniqueObjects } from 'utils/getUniqObjects'

import data from './data.json'

const municipalities = data.map(data => ({
  code: data.Code_Municipalite,
  name: data.Nom_Municipalite_Ar,
}))

const normalizedGouvernorats = data.map(data => ({
  code: data.Code_Gouvernorat,
  name: data.Nom_Gouvernorat_Ar,
}))
const gouvernorats = getUniqueObjects(normalizedGouvernorats, 'code')

const getByCode_Gouvernorat = code => {
  //   debugger
  if (code)
    if (data.filter(gov => gov.Code_Gouvernorat === code.toString()).length > 0)
      return data.filter(gov => gov.Code_Gouvernorat === code.toString())
    else return 'Governorate not found with this code '
  else {
    return []
  }
}

module.exports = {
  getByCode_Gouvernorat,
  municipalities,
  gouvernorats,
}
