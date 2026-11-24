import React, { useState, useEffect } from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Table from "react-bootstrap/Table";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { StoreType } from "./redux/store";
import {
  //   AllocatedArrayType,
  // allocate,
  deleteItem,
  increaseQuantity,
  decreaseQuantity,
  clearCart,
} from "./redux/allocatedSlice";
import {
  // budgetedChanged,
  moneyCalc,
  currencyUnitChanged,
} from "./redux/moneySlice";
//import { nanoid } from "nanoid";
//import { itemForSale, countriesCurrency } from "./data/commodity";
import { IoIosAdd } from "react-icons/io";
import { IoIosRemove } from "react-icons/io";
import {
  useFlutterwave,
  // closePaymentModal,
  // FlutterWaveTypes,
} from "flutterwave-react-v3";
import Modal from "react-bootstrap/Modal";

// Used only if the live exchange rate can't be loaded. Update it now and then.
const FALLBACK_USD_TO_NGN = 1368;

const CURRENCY_SYMBOLS: Record<string, string> = { USD: "$", NGN: "₦" };

const roundToKobo = (n: number) => Math.round(n * 100) / 100;

const formatAmount = (n: number) =>
  n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function App() {
  const allocatedBudget = useSelector(
    (state: StoreType) => state.allocatedBudget
  );
  const money = useSelector((state: StoreType) => state.moneyCalc);
  const dispatch = useDispatch();

  // Product prices come in US dollars. When the shopper picks naira, prices
  // and the amount charged are converted with today's rate, or the backup
  // rate below if the rate service can't be reached.
  const [usdToNgn, setUsdToNgn] = useState(FALLBACK_USD_TO_NGN);
  const [rateIsLive, setRateIsLive] = useState(false);
  useEffect(() => {
    fetch("https://open.er-api.com/v6/latest/USD")
      .then((res) => res.json())
      .then((json) => {
        const ngn = Number(json?.rates?.NGN);
        if (json?.result === "success" && ngn > 0) {
          setUsdToNgn(ngn);
          setRateIsLive(true);
        }
      })
      .catch(() => {
        // Keep the backup rate.
      });
  }, []);
  const rate = money.currencyUnit === "NGN" ? usdToNgn : 1;
  const symbol = CURRENCY_SYMBOLS[money.currencyUnit] ?? "";
  const price = (usd: number) => symbol + formatAmount(usd * rate);

  // const [items, setItems] = useState<{ item: string; unitPrice: number }>();
  // const [quantity, setQuantity] = useState<number>();

  useEffect(() => {
    // console.log(allocatedBudget.length);
    let array: number[] = [];
    allocatedBudget?.forEach((element) => {
      array.push(Number(element.quantity) * Number(element.unitPrice) * rate);
    });

    let totalSpent = roundToKobo(
      array.length > 0
        ? array.reduce((sum, element) => Number(sum) + Number(element))
        : 0
    );

    let remainingAmount: number = Number(money.budgeted) - Number(totalSpent);

    dispatch(
      moneyCalc({
        currencyUnit: money.currencyUnit,
        budgeted: money.budgeted,
        allocated: totalSpent,
        remaining: remainingAmount,
      })
    );
  }, [
    allocatedBudget,
    money.budgeted,
    dispatch,
    money.allocated,
    money.remaining,
    money.currencyUnit,
    rate,
  ]);

  const config: any = {
    public_key: process.env.REACT_APP_FLUTTERWAVE_PUBLIC_KEY,
    tx_ref: Date.now(),
    amount: money.allocated,
    currency: money.currencyUnit,
    payment_options: "card,mobilemoney,ussd",
    customer: {
      email: "user@gmail.com",
      phone_number: "08065410021",
      name: "john doe",
    },
    customizations: {
      title: "My store",
      description: "Payment for items in cart",
      logo: "https://st2.depositphotos.com/4403291/7418/v/450/depositphotos_74189661-stock-illustration-online-shop-log.jpg",
    },
  };
  let navigate = useNavigate();

  const handleFlutterPayment = useFlutterwave(config);

  const [show, setShow] = useState(false);
  const [currencyError, setCurrencyError] = useState(false);

  const handleClose = () => setShow(false);

  return (
    <Container fluid>
      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Use this card details to test pay</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {" "}
          Card number: 5531 8866 5214 2950
          <br />
          cvv: 564 <br />
          Expiry: 09/32
          <br />
          Pin: 3310
          <br />
          OTP: 12345
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
      <Row>
        <Col xs={12} className="d-flex justify-content-between align-items-center">
          <p className="display-5 fw-normal mb-0">Shopping cart</p>
          <Button variant="outline-primary" onClick={() => navigate("/")}>
            Continue shopping
          </Button>
        </Col>

        <Col lg={6}>
          <Form.Control
            plaintext
            readOnly
            placeholder={`Cart value : ${symbol + formatAmount(money.allocated)}`}
            className="border border-1 rounded-2 ps-2 bg-info-subtle"
          />
        </Col>
        <Col
          lg={6}
          className="d-flex justify-content-start align-items-center bg-info-subtle ps-2 rounded-2"
        >
          <Form.Label className="mb-0 me-1">Currency unit</Form.Label>
          <Form.Select
            aria-label="Default select example"
            className="rounded-2 "
            style={{ width: "25%", height: "90%" }}
            value={money.currencyUnit}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              dispatch(currencyUnitChanged(e.target.value));
              if (e.target.value) {
                setCurrencyError(false);
                setShow(true);
              }
            }}
            id="currencyUnit"
          >
            <option value="">Currency Unit</option>

            <option value="USD">$</option>

            <option value="NGN">₦</option>
          </Form.Select>
          {money.currencyUnit === "NGN" && (
            <small className="ms-2 text-muted">
              $1 = ₦{formatAmount(usdToNgn)}
              {rateIsLive ? " (today's rate)" : " (backup rate)"}
            </small>
          )}
        </Col>
      </Row>
      <Row className="mt-5">
        <Col>
          <p className="h3 fw-normal ">Items in cart</p>
          <Table>
            <thead>
              <tr>
                <th>Items</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Item Price</th>
                <th>Increase Quantity</th>
                <th>Decrease Quantity</th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {allocatedBudget.map(({ id, items, quantity, unitPrice }) => {
                return (
                  <tr key={id}>
                    <td>{items}</td>
                    <td>{quantity}</td>
                    <td>{price(Number(unitPrice))}</td>
                    <td>{price(Number(quantity) * Number(unitPrice))}</td>
                    <td>
                      <Button
                        className="p-0 bg-transparent border-0 text-dark"
                        onClick={() => dispatch(increaseQuantity(id))}
                      >
                        <IoIosAdd />
                      </Button>
                    </td>
                    <td>
                      <Button
                        className="p-0 bg-transparent border-0 text-dark"
                        onClick={() => dispatch(decreaseQuantity(id))}
                      >
                        <IoIosRemove />
                      </Button>
                    </td>
                    <td>
                      <Button
                        className="p-0 bg-transparent border-0 text-dark"
                        onClick={() => dispatch(deleteItem(id))}
                      >
                        <i className="bi bi-x-lg p-1 fw-bold rounded-5 bg-danger text-white"></i>
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
          {allocatedBudget.length === 0 && (
            <p className="text-muted">
              Your cart is empty.{" "}
              <Button variant="link" className="p-0 align-baseline" onClick={() => navigate("/")}>
                Browse products
              </Button>
            </p>
          )}
        </Col>
      </Row>
      <Row>
        <Col lg={3} className="d-flex flex-row"></Col>
        <Col lg={3} className="d-flex flex-row "></Col>

        <Col lg={3} className="d-flex flex-row"></Col>
        <Col lg={1}></Col>
        <Col lg={1}>
          <Button
            className="rounded-start-0 py-2 px-5"
            disabled={allocatedBudget.length === 0}
            onClick={() => {
              if (money.currencyUnit) {
                handleFlutterPayment({
                  callback: (response) => {
                    // dispatch(clearCart());
                    dispatch(clearCart());
                    //  closePaymentModal(); // this will close the modal programmatically
                  },
                  onClose: () => {
                    navigate("/");
                  },
                });
              } else {
                setCurrencyError(true);
              }
            }}
          >
            Checkout
          </Button>
          {currencyError && (
            <p className="text-danger small mt-2 text-nowrap text-end">
              Select a currency unit first
            </p>
          )}
        </Col>
        <Col lg={1}></Col>
      </Row>
    </Container>
  );
}

export default App;
