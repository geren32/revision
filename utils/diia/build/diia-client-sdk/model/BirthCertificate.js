"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Document {
    series;
    number;
    department;
    issueDate;
}
class Child {
    lastName;
    firstName;
    middleName;
    birthDate;
    birthPlace;
    currentRegistrationPlaceUA;
    citizenship;
}
class Parent {
    fullName;
    citizenship;
}
class Parents {
    father;
    mother;
}
class Act {
    name;
    registrationPlace;
}
class BirthCertificate {
    id;
    document;
    child;
    parents;
    act;
}
exports.default = BirthCertificate;
