let DB;

const form = document.getElementById("form"),
  nombreMascota = document.getElementById("mascota"),
  nombreCliente = document.getElementById("cliente"),
  telefono = document.getElementById("telefono"),
  fecha = document.getElementById("fecha"),
  hora = document.getElementById("hora"),
  sintomas = document.getElementById("sintomas"),
  listaCitas = document.getElementById("citas"),
  tituloCita = document.getElementById("administra");

//Esperar que el document carga (indexDB necesita eso)

document.addEventListener("DOMContentLoaded", (e) => {
  //crear la BD
  let crearDB = window.indexedDB.open("citas", 1);

  //comprobar si hay error
  crearDB.onerror = () => {
    console.log("hubo un error");
  };
  //si todo esta bienm, mostrar msg y asignas la BD
  crearDB.onsuccess = () => {
    // console.log('Todo listo!');

    //asignar a la bd
    DB = crearDB.result;
    //limpiar el resultado y muestra el resultado
    mostrarCita();
  };

  //metodo solo corre una vez y es para crear el Schema de la BD.
  crearDB.onupgradeneeded = (e) => {
    //el evento es la misma base de datos.
    let db = e.target.result;
    console.log(db);
    //definir el object Store, toma 2 parametros 1-> nameDeLaBd y 2-> opciones

    //keyPath es el indice de la bd
    let objectStore = db.createObjectStore("citas", {
      keyPath: "key",
      autoIncrement: true,
    });

    //crear los indices y campos de la BD, createIndex=> toma parametros:
    //1. nombre, 2. keyPath, 3. Opciones.

    objectStore.createIndex("mascota", "mascota", { unique: false });
    objectStore.createIndex("cliente", "cliente", { unique: false });
    objectStore.createIndex("telefono", "telefono", { unique: true });
    objectStore.createIndex("fecha", "fecha", { unique: false });
    objectStore.createIndex("hora", "hora", { unique: false });
    objectStore.createIndex("sintomas", "sintomas", { unique: false });
  };
  //cuando se envia el form
  form.addEventListener("submit", agregarDatos);
  function agregarDatos(e) {
    e.preventDefault();
    //creando un objeto y llenandolo con el valor de los inputs del form.
    const nuevaCita = {
      mascota: nombreMascota.value,
      cliente: nombreCliente.value,
      telefono: telefono.value,
      fecha: fecha.value,
      hora: hora.value,
      sintomas: sintomas.value,
    };
    //insertar datos en indexDB con transacciones readwrite escribe
    let transaction = DB.transaction(["citas"], "readwrite");
    //creando un nuevo object store para insertar en la BD.
    let objectStore = transaction.objectStore("citas");
    //insertando en la bd el objeto con lo valores del form
    let peticion = objectStore.add(nuevaCita);
    console.log(peticion);

    //si la peticion fue correcta
    peticion.onsuccess = () => {
      form.reset();
    };
    //cuando se complete la transaccion
    transaction.oncomplete = () => {
      console.log("cita agrega");
      //guarda en la bd
      mostrarCita();
    };
    transaction.onerror = () => {
      console.log("hubo un error");
    };
  }

  //mostrar cita
  function mostrarCita() {
    //limpiar los resultados
    while (listaCitas.firstChild) {
      listaCitas.removeChild(listaCitas.firstChild);
    }
    //creando un object store para usar la BD retorna una peticion
    let objectStore = DB.transaction("citas").objectStore("citas");

    //extrayendo la peticion
    objectStore.openCursor().onsuccess = (e) => {
      //curso de ubica en el regidstro indicado para cceder a los datos
      let cursor = e.target.result;
      // console.log(cursor)
      //comprobar que exista el cursor
      if (cursor) {
        let cita = document.createElement("li");
        cita.setAttribute("data-cita-id", cursor.value.key);
        cita.classList.add("list-group-item");
        let {
          mascota,
          cliente,
          telefono,
          fecha,
          hora,
          sintomas,
        } = cursor.value;
        cita.innerHTML = `
                <p class="font-weight-bold">Mascota: <span class="font-weight-normal">${mascota}</span></p>
                <p class="font-weight-bold">Cliente: <span class="font-weight-normal">${cliente}</span></p>
                <p class="font-weight-bold">Teléfono: <span class="font-weight-normal">${telefono}</span></p>
                <p class="font-weight-bold">Hora: <span class="font-weight-normal">${hora}</span></p>
                <p class="font-weight-bold">Fecha: <span class="font-weight-normal">${fecha}</span></p>
                <p class="font-weight-bold">Sintomas: <span class="font-weight-normal">${sintomas}</span></p>
                `;
        //creandoe el boton de borrar
        let btn = document.createElement("button");
        btn.classList.add("borrar", "btn", "btn-danger");
        btn.innerHTML = `<span aria-hidden="true">x</span> Borrar`;

        //ejecuar la funcion par eliminar cuando el evento de clik
        btn.onclick = borrarCita;

        //agrego al elemento cita
        cita.appendChild(btn);

        //append en el padre del li
        listaCitas.appendChild(cita);

        //en caso de tener mas registro en la bd el cursos debe continua las otroas consultas
        cursor.continue();
      } else {
        if (!listaCitas.firstChild) {
          //cuando no hay registros en la bd
          tituloCita.innerHTML = "Agrega citas para comenzar";
          let p = document.createElement("p");
          p.classList.add("text-center");
          p.appendChild(document.createTextNode("No Hay registros"));
          listaCitas.appendChild(p);
        } else {
          tituloCita.innerHTML = "Administra tus citas";
        }
      }
    };
    //borra una cita
    function borrarCita(e) {
      //transversing para selecciona el LI y obtener el atributo, se convierte de string a numero
      let citaId = Number(e.target.parentElement.getAttribute("data-cita-id"));

      //PARA ELIMINAR DE LA BD:

      //creando transaction para eliminat un registro en la BD
      let transaction = DB.transaction(["citas"], "readwrite");
      //creando un nuevo object store para modificiar en la BD.
      let objectStore = transaction.objectStore("citas");
      //eliminando la cita y se le pase el id de cada LI
      let peticion = objectStore.delete(citaId);

      //PARA ELIMINAR DEL DOM:

      transaction.oncomplete = () => {
        //selecina el ul y toma como argumento el elemento li
        e.target.parentElement.parentElement.removeChild(
          e.target.parentElement
        );

        console.log(`Se elimino la cita con el id ${citaId}`);

        //compruebe los registros y muestra el mensaje de titulo dinamicamente
        if (!listaCitas.firstChild) {
          //cuando no hay registros en la bd
          tituloCita.innerHTML = "Agrega citas para comenzar";
          let p = document.createElement("p");
          p.classList.add("text-center");
          p.appendChild(document.createTextNode("No Hay registros"));
          listaCitas.appendChild(p);
        } else {
          tituloCita.innerHTML = "Administra tus citas";
        }
      };
    }
  }
});
