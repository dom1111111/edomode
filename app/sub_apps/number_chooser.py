from random import random, randrange

def flip_a_coin():
    return "heads" if random() > 0.5 else "tails"

def pick_a_number(low:int|float, high:int|float):
    return randrange(low, high)
