#!/bin/bash
cd android && ./gradlew -b ktlint.gradle ktlintCheck --quiet --console=plain