import * as Yup from 'yup'

export const logInSchema = Yup.object().shape({
  email: Yup.string().required('Account email is required').email('Please enter the correct email'),
  password: Yup.string()
    .required('Please enter the login password')
    .min(6, 'The minimum password length is 6 characters'),
})

export const registerSchema = Yup.object().shape({
  name: Yup.string()
    .required('Please enter the account name')
    .min(3, 'Minimum three digits of the account name'),
  email: Yup.string().required('Account email is required').email('Please enter the correct email'),
  password: Yup.string()
    .required('Please enter the login password')
    .min(6, 'The minimum password length is 6 characters'),
  confirmPassword: Yup.string()
    .required('Please enter the confirmation password again')
    .oneOf([Yup.ref('password'), null], 'Confirm the password is incorrect'),
})

export const categorySchema = Yup.object().shape({
  name: Yup.string().required('Category name cannot be empty'),
  slug: Yup.string().required('The path name cannot be empty'),
  image: Yup.string()
    .required('Enter image address')
    .url('Invalid image address')
    .matches(/\.(gif|jpe?g|png|webp)$/i, 'The image address must be a valid image URL'),
})

export const bannerSchema = Yup.object().shape({
  title: Yup.string().required('The name cannot be empty'),
  image: Yup.object().shape({
    url: Yup.string()
      .required('Please enter the image address')
      .url('Invalid address')
      .matches(/\.(gif|jpe?g|png|webp)$/i, 'The image address must be a valid image URL'),
  }),
})

export const sliderSchema = Yup.object().shape({
  title: Yup.string().required('The name cannot be empty'),
  image: Yup.object().shape({
    url: Yup.string()
      .required('Please enter the image address')
      .url('Invalid address')
      .matches(/\.(gif|jpe?g|png|webp)$/i, 'The image address must be a valid image URL'),
  }),
})

export const reviewSchema = Yup.object().shape({
  title: Yup.string()
    .required('The evaluation title cannot be empty')
    .min(4, 'The evaluation title must not be less than 4 characters'),
  comment: Yup.string()
    .required('The evaluation text cannot be empty')
    .min(4, 'The evaluation text should not be less than 4 characters'),
})

export const addressSchema = Yup.object().shape({
  province: Yup.object().shape({
    name: Yup.string().required('Please select your country'),
  }),
  city: Yup.object().shape({
    name: Yup.string().required('Please enter your city'),
  }),
  area: Yup.object().shape({
    name: Yup.string().required('Please enter your region or district'),
  }),
  street: Yup.string().required('The street name cannot be empty'),
  postalCode: Yup.string().required('Please enter your postal code'),
})

export const nameSchema = Yup.object().shape({
  name: Yup.string().required('Name must be registered').min(3, 'Name must exceed 3 characters'),
})

export const mobileSchema = Yup.object().shape({
  mobile: Yup.string()
    .required('Mobile phone number must be registered')
    .min(8, 'Enter a valid phone number')
    .max(18, 'Enter a valid phone number')
    .matches(/^[\d\s+()-]+$/, 'Use digits and optional + ( ) - spaces'),
})
