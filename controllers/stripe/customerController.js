import { Payment, User } from "../../models";
import CustomErrorHandler from "../../services/CustomErrorHandler";
import { STRIPE_SECRET_KEY } from "../../config";
import { HTTP_STATUS } from "../../utils/constants";
import {
  constructResponse,
  errorResponse,
  successResponse,
} from "../../utils/response";

const stripe = require("stripe")(STRIPE_SECRET_KEY);

const usersController = {
  //create customers
  async store(req, res, next) {
    const found = await Payment.find();

    let documents;
    let user,userUpdate;
    try {
      const { name, email, phone } = req.body;
      if (!name || !email || !phone) {
        return errorResponse(
          res,
          HTTP_STATUS.NOT_ACCEPTABLE,
          "All Fields Are Required!"
        );
      }
      const checkUserCustomer = await Payment.findOne({ user: req.user._id });

      if (checkUserCustomer && checkUserCustomer.cus_id) {
        errorResponse(
          res,
          HTTP_STATUS.CONFLICT,
          "customer already exists",
          checkUserCustomer
        );
      } else if (!checkUserCustomer) {
        documents = await stripe.customers.create({
          name: name,
          email: email,
          phone: phone,
        });
        if (documents) {
          const isExist = await Payment.findOne({ user: req.user._id });
          if (!isExist) {
            user = await Payment.create({
              user: req.user._id,
              cus_id: documents.id,
            });
          } else {
            userUpdate=  await User.findOneAndUpdate({_id:req.user._id},
              {cus_id:documents.id})
          
            user = await Payment.findOneAndUpdate(
              { user: req.user._id },
              {
                cus_id: documents.id,
              },
              { new: true }
            );
           userUpdate=  await User.findOneAndUpdate({id:req.user._id},
              {cus_id:documents.id})
          }
        }
      
        if(userUpdate){
          const doc = {
            documents,
            user,
          };
          return successResponse(
            res,
            next,
            doc,
            HTTP_STATUS.CREATED,
            "Stripe customer created successfully..."
          );
        }
       
      }
    } catch (err) {
      return next(err);
    }
  },
  //get all customers
  async index(req, res, next) {
    let documents;
    try {
      documents = await stripe.customers.list({});
    } catch (err) {
      return next(CustomErrorHandler.serverError());
    }
    return successResponse(
      res,
      next,
      documents,
      HTTP_STATUS.OK,
      "Stripe All Customers Found Successfully!"
    );
  },

  //get particular customer
  async show(req, res, next) {
    let documents;
    try {
      if (req.params.id) {
        documents = await stripe.customers.retrieve(req.params.id);
      } else {
        return next(CustomErrorHandler.emptyState());
      }
    } catch (err) {
      return next(err);
    }
    return successResponse(
      res,
      next,
      documents,
      HTTP_STATUS.OK,
      "Stripe Customer Found Successfully!"
    );
  },
  //update customer
  async update(req, res, next) {
    let documents;
    try {
      documents = await stripe.customers.update(req.params.id, {
        balance: req.body.balance,
      });
    } catch (err) {
      return next(err);
    }
    return successResponse(
      res,
      next,
      documents,
      HTTP_STATUS.CREATED,
      "Stripe Customer Updated Successfully!"
    );
  },
  async destroy(req, res, next) {
    let documents;
    try {
      documents = await stripe.customers.del(req.params.id);
    } catch (err) {
      return next(err);
    }
    return constructResponse(res, {
      status: HTTP_STATUS.OK,
      message: "Stripe Customer Deleted Successfully!",
    });
  },

  async balance(req, res, next) {
    let documents;
    try {
      // documents = await stripe.customers.del(req.params.id);
      documents = await stripe.customers.retrieveBalanceTransaction(
        req.params.cus_id,
        req.params.balance_tr_id
      );
    } catch (err) {
      res.status(err.statusCode).json({
        message: err.message,
        statusCode: err.statusCode,
        success: false,
        data: null,
        stack: err.stack,
      });
    }
    res.status(201).json(documents);
  },
  async checkBalance(req, res, next) {
    let documents;
    try {
      // documents = await stripe.customers.del(req.params.id);
      documents = await stripe.customers.retrieveBalanceTransaction(
        req.params.cus_id,
        req.params.balance_tr_id
      );
    } catch (err) {
      res.status(err.statusCode).json({
        message: err.message,
        statusCode: err.statusCode,
        success: false,
        data: null,
        stack: err.stack,
      });
    }
    res.status(201).json(documents);
  },
  async checkBalanceTransactions(req, res, next) {
    try {
      await stripe.customers
        .listBalanceTransactions(req.params.id, { limit: req.body.limit })
        .then((checklist) => {
          return successResponse(
            res,
            next,
            checklist,
            HTTP_STATUS.OK,
            "List Retrived successfully"
          );
        });
    } catch (err) {
      return errorResponse(res, HTTP_STATUS.NOT_FOUND, err.message, null);
    }
  },
  async BalanceTransactionDetail(req, res, next) {
    console.log("daattsdfndfs", req.body);
    try {
      const { created } = req.body;
      const getPayment = await Payment.findOne({ cus_id: req.params.cus_id });

      let infoStripeUser, infoTransferUser;
      getPayment.trnsactions.map(async (item) => {
        if (req.body.type === "sender" && item.sender.created === created) {
          infoTransferUser = item;
          console.log(item.reciver.customer);
        } else if (
          req.body.type === "reciver" &&
          item.sender.created === created
        ) {
          infoTransferUser = item;
        }
      });
      infoStripeUser = await stripe.customers.retrieve(
        req.body.type === "sender"
          ? infoTransferUser.reciver.customer
          : infoTransferUser.sender.customer
      );
      console.log("info", infoTransferUser, infoStripeUser);
      successResponse(
        res,
        next,
        { infoTransferUser, infoStripeUser },
        HTTP_STATUS.OK,
        "get customer information"
      );
    } catch (err) {
      return errorResponse(res, HTTP_STATUS.NOT_FOUND, err.message, null);
    }
  },
};

export default usersController;
