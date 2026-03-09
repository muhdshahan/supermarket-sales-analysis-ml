"""
ML Prediction Functions
Supports:
- Custom trend date ranges
- Custom forecast period
- Clean visualizations
"""

import pandas as pd
from prophet import Prophet
import matplotlib.pyplot as plt
import os

DATA_PATH = "supermarket_sales_dataset.xlsx"
OUTPUT_DIR = "forecast_outputs"

os.makedirs(OUTPUT_DIR, exist_ok=True)


# ----------------------------
# Load Dataset
# ----------------------------
def load_dataset():
    df = pd.read_excel(DATA_PATH)
    df["date"] = pd.to_datetime(df["date"])
    return df


# ----------------------------
# Filter by Date Range
# ----------------------------
def filter_by_date(df, start_date=None, end_date=None):

    if start_date:
        df = df[df["date"] >= pd.to_datetime(start_date)]

    if end_date:
        df = df[df["date"] <= pd.to_datetime(end_date)]

    return df


# ----------------------------
# Helper: Clean Forecast Chart
# ----------------------------
def create_clean_forecast_chart(history, forecast, title, filename):

    plt.figure(figsize=(12,6))

    plt.plot(history["ds"], history["y"], label="Historical Sales", linewidth=2)

    plt.plot(
        forecast["ds"],
        forecast["yhat"],
        linestyle="--",
        linewidth=3,
        label="Forecast"
    )

    plt.title(title)
    plt.xlabel("Date")
    plt.ylabel("Quantity Sold")
    plt.legend()
    plt.grid(True)

    path = f"{OUTPUT_DIR}/{filename}"
    plt.savefig(path)
    plt.close()

    return path


# ----------------------------
# Sales Trend (Historical)
# ----------------------------
def sales_trend(start_date=None, end_date=None):

    df = load_dataset()

    df = filter_by_date(df, start_date, end_date)

    weekly_sales = (
        df.groupby(pd.Grouper(key="date", freq="W"))["quantity_sold"]
        .sum()
        .reset_index()
    )

    plt.figure(figsize=(12,6))

    plt.plot(
        weekly_sales["date"],
        weekly_sales["quantity_sold"],
        linewidth=3
    )

    plt.title("Sales Trend")
    plt.xlabel("Date")
    plt.ylabel("Quantity Sold")
    plt.grid(True)

    path = f"{OUTPUT_DIR}/sales_trend.png"

    plt.savefig(path)
    plt.close()

    return {
        "trend_image": path,
        "start_date": start_date,
        "end_date": end_date
    }


# ----------------------------
# Sales Forecast
# ----------------------------
def sales_forecast(start_date=None, end_date=None, forecast_days=30):

    df = load_dataset()

    df = filter_by_date(df, start_date, end_date)

    weekly_sales = (
        df.groupby(pd.Grouper(key="date", freq="W"))["quantity_sold"]
        .sum()
        .reset_index()
    )

    weekly_sales.columns = ["ds", "y"]

    model = Prophet(
        yearly_seasonality=True
    )

    model.fit(weekly_sales)

    future = model.make_future_dataframe(periods=forecast_days, freq="W")

    forecast = model.predict(future)

    chart_path = create_clean_forecast_chart(
        weekly_sales,
        forecast,
        "Sales Forecast",
        "sales_forecast.png"
    )

    future_sales = forecast.tail(forecast_days)[["ds", "yhat"]]

    return {
        "forecast_image": chart_path,
        "future_sales": future_sales.to_dict(orient="records")
    }


# ----------------------------
# Product Trend
# ----------------------------
def product_trend(product_name, start_date=None, end_date=None):

    df = load_dataset()

    df = filter_by_date(df, start_date, end_date)

    product_df = df[df["product_name"] == product_name]

    weekly_sales = (
        product_df.groupby(pd.Grouper(key="date", freq="W"))["quantity_sold"]
        .sum()
        .reset_index()
    )

    plt.figure(figsize=(12,6))

    plt.plot(
        weekly_sales["date"],
        weekly_sales["quantity_sold"],
        linewidth=3
    )

    plt.title(f"{product_name} Sales Trend")
    plt.xlabel("Date")
    plt.ylabel("Quantity Sold")
    plt.grid(True)

    path = f"{OUTPUT_DIR}/{product_name}_trend.png"

    plt.savefig(path)
    plt.close()

    return {
        "product": product_name,
        "trend_image": path
    }


# ----------------------------
# Product Forecast
# ----------------------------
def product_forecast(product_name, start_date=None, end_date=None, forecast_days=30):

    df = load_dataset()

    df = filter_by_date(df, start_date, end_date)

    product_df = df[df["product_name"] == product_name]

    weekly_sales = (
        product_df.groupby(pd.Grouper(key="date", freq="W"))["quantity_sold"]
        .sum()
        .reset_index()
    )

    weekly_sales.columns = ["ds", "y"]

    model = Prophet()

    model.fit(weekly_sales)

    future = model.make_future_dataframe(periods=forecast_days, freq="W")

    forecast = model.predict(future)

    chart_path = create_clean_forecast_chart(
        weekly_sales,
        forecast,
        f"{product_name} Demand Forecast",
        f"{product_name}_forecast.png"
    )

    predicted_demand = forecast.tail(forecast_days)["yhat"].sum()

    return {
        "product": product_name,
        "forecast_image": chart_path,
        "predicted_demand": int(predicted_demand)
    }


# ----------------------------
# High Performing Products
# ----------------------------
def high_performing_products(top_n=10):

    df = load_dataset()

    product_sales = (
        df.groupby("product_name")["quantity_sold"]
        .sum()
        .sort_values(ascending=False)
        .head(top_n)
    )

    return product_sales.to_dict()


# ----------------------------
# Low Performing Products
# ----------------------------
def low_performing_products(bottom_n=10):

    df = load_dataset()

    product_sales = (
        df.groupby("product_name")["quantity_sold"]
        .sum()
        .sort_values()
        .head(bottom_n)
    )

    return product_sales.to_dict()


# ----------------------------
# Stock Recommendation
# ----------------------------
def stock_recommendation(product_name, forecast_days=30):

    df = load_dataset()

    forecast_result = product_forecast(product_name, forecast_days=forecast_days)

    predicted_demand = forecast_result["predicted_demand"]

    current_stock = (
        df[df["product_name"] == product_name]["stock_level"]
        .iloc[-1]
    )

    safety_stock = predicted_demand * 0.2
    recommended_stock = predicted_demand + safety_stock
    reorder_amount = max(0, recommended_stock - current_stock)

    return {
        "product": product_name,
        "current_stock": int(current_stock),
        "predicted_demand": int(predicted_demand),
        "recommended_stock": int(recommended_stock),
        "reorder_quantity": int(reorder_amount)
    }


# ----------------------------
# Example Run
# ----------------------------
if __name__ == "__main__":

    print("\nTrend Example")
    print(sales_trend("2022-01-01", "2024-12-31"))

    print("\nSales Forecast")
    print(sales_forecast("2022-01-01", "2024-12-31", 12))

    print("\nProduct Trend")
    print(product_trend("Rice", "2023-01-01", "2025-01-01"))

    print("\nProduct Forecast")
    print(product_forecast("Rice", forecast_days=12))

    print("\nStock Recommendation")
    print(stock_recommendation("Rice", 12))