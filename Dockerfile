FROM php:8.2-fpm-alpine

# Встановлення розширень PHP для роботи з базою даних
RUN docker-php-ext-install mysqli pdo pdo_mysql

# Встановлення системних бібліотек та розширень для графіки
RUN apk add --no-cache \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    oniguruma-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install gd mbstring

# Копіювання та налаштування php.ini для продакшн-середовища
RUN cp "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"
RUN sed -i 's/upload_max_filesize = 2M/upload_max_filesize = 32M/' "$PHP_INI_DIR/php.ini"
RUN sed -i 's/post_max_size = 8M/post_max_size = 32M/' "$PHP_INI_DIR/php.ini"

WORKDIR /var/www/html
