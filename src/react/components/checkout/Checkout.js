import React, { useState, useEffect } from 'react';
import { updateShipping } from '../../../redux/actions';
import { connect } from 'react-redux';
import { injectStripe } from 'react-stripe-elements';
import { makeStyles } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Paper from '@material-ui/core/Paper';
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';
import Button from '@material-ui/core/Button';
import Link from '@material-ui/core/Link';
import Typography from '@material-ui/core/Typography';
import AddressForm from './AddressForm';
import PaymentForm from './PaymentForm';
import Review from './Review';
import clsx from 'clsx';
import CircularProgress from '@material-ui/core/CircularProgress';
import { green } from '@material-ui/core/colors';
import { grey } from '@material-ui/core/colors';


function Copyright() {
  return (
    <Typography variant="body2" color="textSecondary" align="center">
      {'Copyright © '}
      <Link color="inherit" href="https://material-ui.com/">
        Your Website
      </Link>{' '}
      {new Date().getFullYear()}
      {'.'}
    </Typography>
  );
}

const useStyles = makeStyles(theme => ({

  paper: {
    paddingTop: theme.spacing(8),
    paddingBottom: theme.spacing(8),
    paddingLeft: 15,
    paddingRight: 15,
  },
  stepper: {
    padding: theme.spacing(3, 0, 5),
  },
  buttons: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  button: {
    marginTop: theme.spacing(3),
    marginLeft: theme.spacing(1),
  },
  buttonSuccess: {
    backgroundColor: green[500],
    '&:hover': {
      backgroundColor: green[700],
    },
  },
  buttonProgress: {
    color: green[500],
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -12,
    marginLeft: -12,
    zIndex: 2,
  },  
  loadingCover: {
    width: '100%',
    height: 1000,
    position: 'absolute',
    top: '5%',
    left: '0%',
    zIndex: 1,
    paddingLeft: 15,
    paddingRight: 15,
    background: grey[100],
  }
}));

const steps = ['Shipping address', 'Payment details', 'Review your order'];

const Checkout = (props) => {   
  const classes = useStyles();
  const [activeStep, setActiveStep] = useState(0);
  const [stripeToken, setToken] = useState({});
  const [orderData, setOrderData] = useState({});
  const [paymentPromise, setPaymentPromise] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);


  const handleLoading = () => {
    if (!loading) {
      setSuccess(false);
      setLoading(true);
    } else {
      setLoading(false);
      setSuccess(true);
    }
  };
  const changeLoading = (bool) => {
    if (bool) {
      setLoading(true);
      setSuccess(false);
    } else {
      setLoading(false);
      setSuccess(true);
    }
  } 
  const createSkuList = () => {
    const skuList = props.items.map((item) => {
      return {
        type: 'sku',
        parent: item.itemSku.id,
        quantity: item.itemSku.metadata.quantity
      }
    })
    return skuList
  }

  const checkFields = () => {
    let fields = Object.keys(props.shippingField)
    for (let i=0; i<fields.length; i++) {
      if (props.shippingField[fields[i]] === '') {
        return true;
      }
    }
    return false;
  }

  const handleNext = () => {
    setActiveStep(activeStep + 1 );
  }
  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };

  const handleClick = async() => {
    switch (activeStep) {
      case 0: {
        if (checkFields()) {
          alert('please completely fillout the form')
        } else {
          handleLoading();
          await fetch('/api/create-order', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              items: createSkuList(),
              shipping: {
                name: (props.shippingField.firstName + ' ' + props.shippingField.lastName),
                address: {
                  line1: props.shippingField.address1,
                  city: props.shippingField.city,
                  state: props.shippingField.state,
                  postal_code: props.shippingField.country
                }
              },
              email: props.shippingField.email
            })
          })
          .then(result => {
            console.log(result);
            return result.json();
          })
          .then(data => {
            setOrderData(data)
          }); 
          handleNext(); 
        }

        break;
      }
      case 1: {
        let {token} = await props.stripe.createToken();
        setToken(token)
        console.log(token)
        console.log(stripeToken)
        handleNext(); 
        break;  
      }
      case 2: {
        handleLoading();
        await fetch("/api/pay-order", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            orderId: orderData.id,
            token: stripeToken.id
          })
        })
        .then(result => {
          console.log(result);
          return result.json();
        })
        .then(data => {
          setPaymentPromise(data)
        }); 
        
        handleNext(); 
        handleLoading();
        console.log(paymentPromise);          
        break;  
      }   
      default: {
        break;
      }   
  
    }  
    
  };
  


  const handleChange = (event) => {
    let updatedObj = {}
    let keyArr = Object.keys(props.shippingField)  
    for (let i=0; i<=keyArr.length; i++) {
      if (keyArr[i] === event.target.name) {
        updatedObj[keyArr[i]] = event.target.value;
      } else {
        updatedObj[keyArr[i]] = props.shippingField[keyArr[i]];
      }  
    }
    console.log(updatedObj)
    props.updateShipping(updatedObj)
    console.log(props)
    console.log(stripeToken)
    console.log(orderData)
  }
    
  return (
    <React.Fragment>  
    <Paper className={classes.paper}>
      <Typography component="h1" variant="h4" align="center">
        Checkout
      </Typography>
      <Stepper activeStep={activeStep} className={classes.stepper}>
        {steps.map(label => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      <React.Fragment>
        {activeStep === steps.length ? (
          <React.Fragment>
            <Typography variant="h5" gutterBottom>
              Thank you for your order.
            </Typography>
            <Typography variant="subtitle1">
              Your order number is {paymentPromise.id}. We have emailed your order confirmation to {paymentPromise.email}, and will
              send you an update when your order has shipped.
            </Typography>
          </React.Fragment>
        ) : (
          <React.Fragment>  
            {loading &&    
              <Paper className={classes.loadingCover}>
                <CircularProgress size={52} className={classes.buttonProgress} />
              </Paper>                 
            }
            {activeStep === 0 &&       
              <AddressForm 
                shippingField={props.shippingField}
                handleChange={handleChange}
              />              
            }      
            {activeStep === 1 &&     
                <PaymentForm         
                  changeLoading={changeLoading}                
                />               
            } 
            {activeStep === 2 &&       
              <Review 
                items={props.items}
                stripeToken={stripeToken}
                orderData={orderData}
                shippingField={props.shippingField}
              />              
            }                        
            <div className={classes.buttons}>
              {activeStep !== 0 && (
                <Button onClick={handleBack} className={classes.button}>
                  Back
                </Button>
              )}
              <Button
                variant="contained"
                color="primary"
                onClick={handleClick}
                className={classes.button}
                disabled={loading}
              >
                {activeStep === steps.length - 1 ? 'Place order' : 'Next'}
              </Button>


            </div>
          </React.Fragment>
        )}
      </React.Fragment>
      </Paper>

    </React.Fragment>                 
  );
};



export default connect(
  null, 
  { updateShipping }
)(injectStripe(Checkout));