/* global proj4, ymaps, peoples, polygons */

proj4.defs(
  "EPSG:3857",
  "+title=WGS 84 / Pseudo-Mercator +proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs"
);
proj4.defs(
  "EPSG:4326",
  "+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees"
);

function init() {
  const map = new ymaps.Map("map", {
    center: [44.912402, 34.122698],
    zoom: 16,
  });
  Object.keys(peoples).forEach((key) => {
    if (
      !polygons.some((polygon) => key === polygon.properties.options.cad_num)
    ) {
      console.error("pv not found", key);
    }
  });

  const colors = {
    default: "#ccc",
    withContact: "#50c878",
    withAddress: "#dc143c",
  };
  polygons.forEach((polygon) => {
    const cadNum = polygon.properties.options.cad_num;
    const readableAddress = polygon.properties.options.readable_address;
    const hint = peoples[cadNum] || "";
    let address = "";
    let color = colors.default;

    if (
      readableAddress.match(/, улица [а-я]+/i) ||
      [
        "ул. Адама Турчинского",
        "ул Героев Севастополя",
        "ул Валентины Гризодубовой",
        "ул. Василия Горишнего",
        "ул.Валентины Гризодубовой",
        "ул Героев Альмы",
        "ул Дмитрия Карбышева",
        "ул Крылова",
        "ул Литовского полка",
        "ул Василия Горишнего",
        "ул Романкошская",
        "Литовского полка ул.",
        "ул Эльмиры Аблямитовой",
        "ул Евгения Семнякова",
      ].some((street) => readableAddress.includes(street))
    ) {
      color = colors.withAddress;
      address = readableAddress;
    } else if (
      readableAddress.includes("улица Нестерова") &&
      readableAddress.includes("земельный участок")
    ) {
      color = colors.withAddress;
    } else if (
      readableAddress.match(
        /поз. по ГП-\d+|поз по ГП-\d+|поз по ГП - \d+|поз. ГП-\d+|поз. по ГП - \d+|поз. по ГП\d+|поз.по ГП-\d+|ГП-\d+|ГП - \d+/gi
      ) ||
      readableAddress.match(
        /"Петровские высоты"|«Петровские Высоты»|в районе Петровские высоты/gi
      ) ||
      readableAddress === "Республика Крым, г. Симферополь" ||
      readableAddress === "Республика Крым, г Симферополь" ||
      readableAddress.match(/в районе ул. Нестерова/gi)
    ) {
      //
    } else {
      console.log("unknown", cadNum, readableAddress);
    }

    if (hint) {
      color = colors.withContact;
      address = "";
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
          hintContent: `${cadNum} ${address} ${hint}`,
        },
        {
          fillColor: color,
          strokeColor: "#333",
          opacity: hint ? 0.8 : 0.3,
        }
      )
    );
  });
}

fetch(
  "https://docs.google.com/spreadsheets/d/1NX9xJNbNw2kOiaw1AgzZAJGff22J66-lcWQh9Tk9WiU/export?format=csv&id=1NX9xJNbNw2kOiaw1AgzZAJGff22J66-lcWQh9Tk9WiU"
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
