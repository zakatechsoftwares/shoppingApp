import React, { useEffect, useState } from "react";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Card from "react-bootstrap/Card";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import Button from "react-bootstrap/Button";
import Navbar from "react-bootstrap/Navbar";
import { FaCartPlus } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import Modal from "react-bootstrap/Modal";
import { allocate, deleteItem } from "./redux/allocatedSlice";
import { useNavigate } from "react-router-dom";
import { StoreType } from "./redux/store";

// Cuts text off after the given number of lines, ending with "…".
const clampLines = (lines: number): React.CSSProperties => ({
  display: "-webkit-box",
  WebkitLineClamp: lines,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
});

function Homepage() {
  const addedItems = useSelector((state: StoreType) => state.allocatedBudget);

  type ObjectType = {
    category: string;
    description: string;

    id: string;

    image: string;
    price: number;

    title: string;
  };
  const [data, setData] = useState<ObjectType[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );
  const itemsInCart = useSelector((state: StoreType) => state.allocatedBudget);
  let navigate = useNavigate();
  let dispatch = useDispatch();
  useEffect(() => {
    fetch("https://fakestoreapi.com/products?limit=12")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => {
        setData(json);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, []);

  const [show, setShow] = useState(false);
  const [selected, setSelected] = useState<ObjectType | null>(null);

  const isInCart = (id: string) =>
    itemsInCart.some((cartItem) => cartItem.id === id);

  const toggleCart = (item: ObjectType) => {
    if (isInCart(item.id)) {
      dispatch(deleteItem(item.id));
    } else {
      dispatch(
        allocate({
          id: item.id,
          items: item.title,
          quantity: 1,
          unitPrice: Number(item.price),
        })
      );
    }
  };

  const handleClose = () => setShow(false);

  return (
    <Container fluid>
      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Empty cart</Modal.Title>
        </Modal.Header>
        <Modal.Body>Your cart is empty, Add items to cart</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
      <Navbar expand="lg" className="bg-body-tertiary">
        <Container>
          <Navbar.Brand href="#home">
            Welcome to our online shopping application
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto">
              <Button
                onClick={() => {
                  if (addedItems.length < 1) {
                    setShow(true);
                  } else {
                    navigate("/cart");
                  }
                }}
              >
                Go to cart
              </Button>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {status === "loading" && (
        <p className="text-center text-muted my-5">Loading products…</p>
      )}
      {status === "error" && (
        <p className="text-center text-danger my-5">
          Couldn't load products. Please refresh the page to try again.
        </p>
      )}
      <Row xs={1} sm={2} lg={4} className="g-4 my-3">
        {data.map((item) => {
          const inCart = isInCart(item.id);

          return (
            <Col key={item.id}>
              <Card className="h-100 shadow-sm">
                <div
                  className="bg-white d-flex align-items-center justify-content-center p-3 border-bottom"
                  style={{ height: 280 }}
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    style={{
                      maxHeight: "100%",
                      maxWidth: "100%",
                      objectFit: "contain",
                    }}
                  />
                </div>
                <Card.Body className="d-flex flex-column">
                  <Card.Title className="fs-6" style={clampLines(2)}>
                    {item.title}
                  </Card.Title>
                  <p className="fw-semibold mb-1">
                    ${Number(item.price).toFixed(2)}
                  </p>
                  <Card.Text
                    className="text-muted small mb-2"
                    style={clampLines(2)}
                  >
                    {item.description}
                  </Card.Text>
                  <Button
                    variant="link"
                    className="p-0 mt-auto align-self-start"
                    onClick={() => setSelected(item)}
                  >
                    Details
                  </Button>
                </Card.Body>
                <Button
                  variant={inCart ? "outline-danger" : "primary"}
                  className="rounded-0 rounded-bottom"
                  onClick={() => toggleCart(item)}
                >
                  <FaCartPlus className="me-1" />
                  {inCart ? "Remove from cart" : "Add to cart"}
                </Button>
              </Card>
            </Col>
          );
        })}
      </Row>

      <Modal
        show={selected !== null}
        onHide={() => setSelected(null)}
        size="lg"
        centered
      >
        {selected && (
          <>
            <Modal.Header closeButton>
              <Modal.Title className="fs-5">{selected.title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Row className="g-4 align-items-center">
                <Col md={5} className="text-center">
                  <img
                    src={selected.image}
                    alt={selected.title}
                    style={{
                      maxHeight: 360,
                      maxWidth: "100%",
                      objectFit: "contain",
                    }}
                  />
                </Col>
                <Col md={7}>
                  <p className="fs-4 fw-semibold mb-2">
                    ${Number(selected.price).toFixed(2)}
                  </p>
                  <p className="text-capitalize text-muted small mb-3">
                    {selected.category}
                  </p>
                  <p className="mb-0">{selected.description}</p>
                </Col>
              </Row>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setSelected(null)}>
                Close
              </Button>
              <Button
                variant={isInCart(selected.id) ? "outline-danger" : "primary"}
                onClick={() => toggleCart(selected)}
              >
                <FaCartPlus className="me-1" />
                {isInCart(selected.id) ? "Remove from cart" : "Add to cart"}
              </Button>
            </Modal.Footer>
          </>
        )}
      </Modal>
    </Container>
  );
}

export default Homepage;
