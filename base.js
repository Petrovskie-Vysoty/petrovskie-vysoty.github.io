/* global proj4, ymaps, peoples, polygonsPrev, polygonsCur */

proj4.defs(
  "EPSG:3857",
  "+title=WGS 84 / Pseudo-Mercator +proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs",
);
proj4.defs(
  "EPSG:4326",
  "+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees",
);

function init() {
  const map = new ymaps.Map("map", {
    center: [44.913, 34.122698],
    zoom: 16,
  });

  let wateriImageBounds = [
    [44.89597, 34.10111],
    [44.92831, 34.16473],
  ];

  // Создаем объект GroundOverlay для наложения изображения
  let waterOverlay = new ymaps.GeoObject(
    {
      geometry: {
        type: "Rectangle",
        coordinates: wateriImageBounds,
      },
      properties: {
        hintContent: "Вода Крыма",
      },
    },
    {
      fillImageHref: "water.png",
      fillOpacity: 0.7,
      strokeWidth: 0,
      zIndex: 100,
    },
  );

  let sewageImageBounds = [
    [44.901405, 34.10273],
    [44.9522, 34.15417],
  ];

  // Создаем объект GroundOverlay для наложения изображения
  let sewageOverlay = new ymaps.GeoObject(
    {
      geometry: {
        type: "Rectangle",
        coordinates: sewageImageBounds,
      },
      properties: {
        hintContent: "Вода Крыма",
      },
    },
    {
      fillImageHref: "sewage.png",
      fillOpacity: 0.7,
      strokeWidth: 0,
      zIndex: 100,
    },
  );

  let gasImageBounds = [
    [44.900938, 34.10759],
    [44.9295, 34.136133],
  ];

  // Создаем объект GroundOverlay для наложения изображения
  let gasOverlay = new ymaps.GeoObject(
    {
      geometry: {
        type: "Rectangle",
        coordinates: gasImageBounds,
      },
      properties: {
        hintContent: "Крымгазсети",
      },
    },
    {
      fillImageHref: "gas.png",
      fillOpacity: 0.7,
      strokeWidth: 0,
      zIndex: 100,
    },
  );

  // Управление видимостью слоя канализации
  let sewageVisible = false;
  const sewageToggleBtn = document.getElementById("sewageToggle");

  sewageToggleBtn.addEventListener("click", function () {
    sewageVisible = !sewageVisible;

    if (sewageVisible) {
      map.geoObjects.add(sewageOverlay);
      sewageToggleBtn.classList.add("active");
    } else {
      map.geoObjects.remove(sewageOverlay);
      sewageToggleBtn.classList.remove("active");
    }
  });

  // Управление видимостью слоя воды
  let waterVisible = false;
  const waterToggleBtn = document.getElementById("waterToggle");

  waterToggleBtn.addEventListener("click", function () {
    waterVisible = !waterVisible;

    if (waterVisible) {
      map.geoObjects.add(waterOverlay);
      waterToggleBtn.classList.add("active");
    } else {
      map.geoObjects.remove(waterOverlay);
      waterToggleBtn.classList.remove("active");
    }
  });

  // Управление видимостью слоя газа
  let gasVisible = false;
  const gasToggleBtn = document.getElementById("gasToggle");

  gasToggleBtn.addEventListener("click", function () {
    gasVisible = !gasVisible;

    if (gasVisible) {
      map.geoObjects.add(gasOverlay);
      gasToggleBtn.classList.add("active");
    } else {
      map.geoObjects.remove(gasOverlay);
      gasToggleBtn.classList.remove("active");
    }
  });

  // Функция для обновления слоя воды с новыми границами
  function updateOverlay() {
    // Удаляем старый слой
    map.geoObjects.remove(gasOverlay);

    // Создаем новый слой с обновленными границами
    gasOverlay = new ymaps.GeoObject(
      {
        geometry: {
          type: "Rectangle",
          coordinates: gasImageBounds,
        },
        properties: {
          hintContent: "Вода Крыма",
        },
      },
      {
        fillImageHref: "gas.png",
        fillOpacity: 0.7,
        strokeWidth: 0,
        zIndex: 100,
      },
    );

    map.geoObjects.add(gasOverlay);
  }
  const delta = 0.001;

  // Получаем элементы слайдеров
  gasImageBounds.forEach((_, a) => {
    gasImageBounds[a].forEach((_, b) => {
      const value = gasImageBounds[a][b];

      const slider = document.getElementById(`${a}.${b}`);
      if (!slider) {
        return;
      }
      slider.value = value;
      slider.max = value + delta;
      slider.min = value - delta;

      const valueLabel = document.getElementById(`${a}.${b}_l`);
      // Обработчики изменения слайдеров
      slider.addEventListener("input", function () {
        const value = parseFloat(this.value);
        gasImageBounds[a][b] = value;
        console.log(JSON.stringify(gasImageBounds));
        valueLabel.textContent = value.toFixed(5);
        updateOverlay();
      });
    });
  });

  Object.keys(peoples).forEach((key) => {
    if (
      !polygonsCur.some((polygon) => key === polygon.properties.options.cad_num)
    ) {
      console.error("pv not found", key);
    }
  });

  const colors = {
    default: "#ccc",
    withContact: "#50c878",
    withAddress: "#dc143c",
    withNewAddress: "#660035",
  };

  let newCount = 0;
  let newAddressCount = 0;
  polygonsCur.forEach((polygon) => {
    const polygonPrev = polygonsPrev.find(
      (prev) =>
        prev.properties.options.cad_num === polygon.properties.options.cad_num,
    );
    const isNew = !polygonPrev;

    if (isNew) {
      newCount++;
    }

    const cadNum = polygon.properties.options.cad_num;
    const readableAddress = polygon.properties.options.readable_address;
    let userContact = peoples[cadNum] || "";
    let address = "";
    let color = colors.default;

    let newAddress = false;

    if (
      polygonPrev &&
      polygonPrev.properties.options.readable_address !==
        polygon.properties.options.readable_address
    ) {
      newAddress = true;
    }

    if (newAddress) {
      newAddressCount++;
    }

    if (
      readableAddress.match(/, улица [а-я]+/i) ||
      [
        "Адама Турчинского",
        "Героев Севастополя",
        "Валентины Гризодубовой",
        "Героев Альмы",
        "Дмитрия Карбышева",
        "Крылова",
        "Литовского полка",
        "Василия Горишнего",
        "Романкошская",
        "Эльмиры Аблямитовой",
        "Евгения Семнякова",
        "Генерала Рудзевича",
        "Географическая",
      ].some((street) => readableAddress.includes(street))
    ) {
      color = newAddress ? colors.withNewAddress : colors.withAddress;
      address = readableAddress;
    } else if (
      readableAddress.includes("улица Нестерова") &&
      readableAddress.includes("земельный участок")
    ) {
      color = colors.withAddress;
    } else if (
      readableAddress.match(
        /поз. по ГП-\d+|поз по ГП-\d+|поз по ГП - \d+|поз. ГП-\d+|поз. по ГП - \d+|поз. по ГП\d+|поз.по ГП-\d+|ГП-\d+|ГП - \d+/gi,
      ) ||
      readableAddress.match(
        /"Петровские высоты"|«Петровские Высоты»|в районе Петровские высоты/gi,
      ) ||
      readableAddress === "Республика Крым, г. Симферополь" ||
      readableAddress === "Республика Крым, г Симферополь" ||
      readableAddress.match(/в районе ул. Нестерова/gi)
    ) {
      //
    } else {
      console.log("unknown", cadNum, readableAddress);
    }

    if (userContact) {
      color = colors.withContact;
    }

    if (
      false &&
      [
        "Петровские высоты",
        "Петровские Высоты",
        "Петровский высоты",
        "Петровский Высоты",
        "Петровские высотв",
        "петровские высоты",
        "Петровске высоты",

        "Крылова",

        "Адама Турчинского",
        "Александра Иваниченко",
        "Александра Меншикова",
        "Алексея Любимского",
        "Бекира Чобан-заде",
        "Бориса Аршинцева",
        "Валентина Гаршина",
        "Валентины Гризодубовой",
        "Валерия Аверкина",
        "Василия Горишнего",
        "Василия Шломовича",
        "Виктора Гудкова",
        "Вячеслава Зарубина",
        "Генерала Рудзевича",
        "Географическая",
        "Героев Альмы",
        "Героев Севастополя",
        "Дмитрия Быстролетова",
        "Дмитрия Карбышева",
        "Евгения Семнякова",
        "Защитников Отечества",
        "Ильяса Бахшиша",
        "Крымского ополчения",
        "Литовского полка",
        "Максима Дзюбина",
        "Нестерова",
        "Николая Эрнста",
        "Романкошская",
        "Суздальского полка",
        "Фаины Раневской",
        "Чесменская",
        "Эдуарда Тотлебена",
        "Эльмиры Аблямитовой",
      ].some((v) => readableAddress.includes(v))
    ) {
      color = "#f0f";
      userContact = "1";
    } else {
      //console.log("новая улица", readableAddress);
    }

    map.geoObjects.add(
      new ymaps.Polygon(
        [
          polygon.geometry.coordinates[0].map((v) => {
            const conv = proj4("EPSG:3857", "EPSG:4326", v);

            return [conv[1] + 0.000065, conv[0] + 0.000075];
          }),
        ],
        {
          hintContent: [cadNum, address, userContact]
            .filter(Boolean)
            .join("<br />"),
        },
        {
          fillColor: color,
          strokeColor: isNew ? "#00f" : "#333",
          strokeWidth: isNew ? 2 : 1,
          opacity: userContact ? 0.8 : 0.3,
        },
      ),
    );
  });

  console.log("новых участков", newCount);
  console.log("новых адресов", newAddressCount);

  // потерянные участки
  polygonsPrev.forEach((polygon) => {
    const current = polygonsCur.find(
      (cur) =>
        cur.properties.options.cad_num === polygon.properties.options.cad_num,
    );

    if (!current) {
      map.geoObjects.add(
        new ymaps.Polygon(
          [
            polygon.geometry.coordinates[0].map((v) => {
              const conv = proj4("EPSG:3857", "EPSG:4326", v);

              return [conv[1] + 0.000065, conv[0] + 0.000075];
            }),
          ],
          {
            fillColor: "#f0f",
            strokeWidth: 0,
            opacity: 1,
          },
        ),
      );
    }
  });
}

fetch(
  "https://docs.google.com/spreadsheets/d/1NX9xJNbNw2kOiaw1AgzZAJGff22J66-lcWQh9Tk9WiU/export?format=csv&id=1NX9xJNbNw2kOiaw1AgzZAJGff22J66-lcWQh9Tk9WiU",
)
  .then((res) => res.text())
  .then((res) => {
    window.peoples = {};

    const lines = res.split("\n");
    lines.shift();

    lines.forEach((line) => {
      const [, , , num, phone, name] = line.split(",");

      window.peoples[num] = `${phone} ${name}`;
    });

    ymaps.ready(init);
  });
