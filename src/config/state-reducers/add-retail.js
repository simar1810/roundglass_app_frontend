import { addRetailInitialState } from "../state-data/add-retail";

export function addRetailReducer(state, action) {
  switch (action.type) {
    case "CHANGE_FIELD_VALUE":
      return {
        ...state,
        [action.payload.name]: action.payload.value
      }
    case "SELECT_CLIENT":
      return {
        ...state,
        clientName: action.payload.clientId === state.clientId ? "" : action.payload.name,
        clientId: action.payload.clientId === state.clientId ? "" : action.payload.clientId
      }
    case "SET_CURRENT_STAGE":
      return {
        ...state,
        stage: action.payload
      }
    case "SET_PRODUCT_QUANTITY": {
      const nextQty = Math.max(Number(action.payload.quantity) || 0, 0);
      const exists = state.productModule.some(product => product._id === action.payload._id);
      return {
        ...state,
        productModule: exists
          ? state.productModule.map(product =>
            product._id === action.payload._id
              ? { ...product, quantity: nextQty }
              : product
          )
          : [
            ...state.productModule,
            { _id: action.payload._id, quantity: nextQty }
          ],
      };
    }
    case "ADD_PRODUCT_TO_PRODUCT_MODULE":
      return {
        ...state,
        productModule: [
          ...(state.productModule || []),
          {
            ...action.payload,
            quantity: 1
          }
        ],
      }
    case "SET_ORDER_METADATA":
      return {
        ...state,
        ...action.payload
      }
    case "ORDER_CREATED":
      return {
        ...state,
        orderId: action?.payload,
        stage: 4
      }
    case "ORDER_REQUESTED":
      return {
        ...state,
        stage: 4
      }
    case "PREVIOUS_STAGE":
      if (![2, 3].includes(state.stage)) return state
      return {
        ...state,
        stage: state.stage - 1
      }
    default:
      return state;
  }
}

export function changeFieldvalue(name, value) {
  return {
    type: "CHANGE_FIELD_VALUE",
    payload: {
      name,
      value
    }
  }
}

export function selectClient(clientId, name) {
  return {
    type: "SELECT_CLIENT",
    payload: {
      clientId,
      name
    }
  }
}

export function setCurrentStage(payload) {
  return {
    type: "SET_CURRENT_STAGE",
    payload
  }
}

export function setProductAmountQuantity(_id, quantity) {
  return {
    type: "SET_PRODUCT_QUANTITY",
    payload: {
      _id,
      quantity
    }
  }
}

export function setOrderMetaData(payload) {
  return {
    type: "SET_ORDER_METADATA",
    payload: {
      costPrice: payload.costPrice,
      profit: payload.profit,
      sellingPrice: payload.salesPrice,
    }
  }
}

export function addProductToProductModule(payload) {
  return {
    type: "ADD_PRODUCT_TO_PRODUCT_MODULE",
    payload
  }
}

export function orderCreated(payload) {
  return {
    type: "ORDER_CREATED",
    payload: payload
  }
}

export function orderRequested() {
  return {
    type: "ORDER_REQUESTED"
  }
}

export function previousStage() {
  return {
    type: "PREVIOUS_STAGE"
  }
}

export function init(payload) {
  return {
    ...addRetailInitialState,
    stage: payload.stage || addRetailInitialState.stage,
    acceptFlow: payload.acceptFlow || false,
    coachId: payload.coachId,
    coachMargin: payload.margin,
    selectedBrandId: payload.selectedBrandId,
    margins: payload.margins,
    brand: {
      margins: payload.margins,
      _id: payload.selectedBrandId
    },
    clientId: payload.clientId && payload.clientId._id ? payload.clientId._id : null,
    productModule: payload.productModule,
    status: payload.status,
    clientName: payload?.clientId?.name || "",
    orderId: payload.orderId || "",
    actionType: payload.actionType
  }
}

const requestPayloadFields = ["clientId", "coachId", "clientName", "productModule", "profit", "costPrice", "brand", "customerMargin", "coachMargin", "sellingPrice"];
export function generateRequestPayload(state) {
  const payload = {}
  for (const field of requestPayloadFields) {
    payload[field] = state[field]
  }
  return payload;
}

export function generateClientRequestPayload() {
  const payload = {}

  return payload
}