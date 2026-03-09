import pandas as pd
import numpy as np
from faker import Faker
import random
from datetime import datetime, timedelta

fake = Faker()

# Product choice
product_choices = [
    "Rice","Egg","Butter","Milk","Curd","Wheat","Peas","Mango","Carrot",
    "Apple","Papaya","Watermelon","Fish","Chicken","Beef","Spoon","Table","Utensils","Tomato","Onion","Potato","Cashewnut","Grapes","Brinjal"
]

# Configuration
NUM_ROWS = 100000
NUM_SHOPS = 5

start_date = datetime(2018,1,1)
end_date = datetime(2026,3,9)

date_range = (end_date - start_date).days

# Categories
product_category_map = {
"Rice":"Rice & Grains",
"Wheat":"Rice & Grains",
"Egg":"Dairy",
"Milk":"Dairy",
"Butter":"Dairy",
"Curd":"Dairy",
"Mango":"Fruits",
"Apple":"Fruits",
"Papaya":"Fruits",
"Watermelon":"Fruits",
"Grapes":"Fruits",
"Carrot":"Vegetables",
"Tomato":"Vegetables",
"Onion":"Vegetables",
"Potato":"Vegetables",
"Brinjal":"Vegetables",
"Peas":"Vegetables",
"Fish":"Meat",
"Chicken":"Meat",
"Beef":"Meat",
"Spoon":"Household",
"Table":"Household",
"Grinder":"Household",
"Utensils":"Household",
"Cashewnut":"Fruits"
}

product_demand_weight = {
    "Rice": 20,
    "Wheat": 18,
    "Egg": 16,
    "Milk": 15,
    "Butter": 10,
    "Curd": 12,

    "Mango": 14,
    "Apple": 13,
    "Papaya": 9,
    "Watermelon": 11,
    "Grapes": 10,
    "Cashewnut": 5,

    "Carrot": 12,
    "Tomato": 14,
    "Onion": 15,
    "Potato": 16,
    "Brinjal": 8,
    "Peas": 7,

    "Fish": 6,
    "Chicken": 10,
    "Beef": 8,

    "Spoon": 3,
    "Table": 1,
    "Grinder": 2,
    "Utensils": 4
}

# Generate products
products = []

for i, product_name in enumerate(product_choices):

    category = product_category_map[product_name]

    products.append({
        "product_id": i + 1,
        "product_name": product_name,
        "category": category,
        "price": round(random.uniform(10,300),2)
    })

products_df = pd.DataFrame(products)

# Shops
shops = [f"Shop_{i+1}" for i in range(NUM_SHOPS)]

data = []

for i in range(NUM_ROWS):

    # random date
    date = start_date + timedelta(days=random.randint(0,date_range))

    product = random.choice(products)

    shop = random.choice(shops)

    month = date.month
    weekday = date.weekday()

    base_lambda = product_demand_weight[product["product_name"]]
    base_demand = np.random.poisson(base_lambda)

    # seasonality
    if product["category"] == "Rice" and month == 12:
        base_demand *= 3

    if product["category"] == "Fruits" and month in [4,5,6]:
        base_demand *= 2

    if weekday in [5,6]:
        base_demand *= 2

    demand_noise = random.uniform(0.7,1.3)
    base_demand *= demand_noise

    quantity = max(1,int(base_demand))

    price = product["price"]

    revenue = quantity * price

    stock_level = random.randint(50,500)

    data.append({
        "date":date,
        "shop":shop,
        "product_id":product["product_id"],
        "product_name":product["product_name"],
        "category":product["category"],
        "price":price,
        "quantity_sold":quantity,
        "revenue":revenue,
        "stock_level":stock_level
    })


df = pd.DataFrame(data)

df.sort_values("date", inplace=True)

df.to_excel("supermarket_sales_dataset.xlsx", index=False)

print("Dataset generated successfully")
print(df.head())